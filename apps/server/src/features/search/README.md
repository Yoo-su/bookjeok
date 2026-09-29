# Search Feature (RAG 기반 AI 도서 검색)

자연어 질문을 받아 **의도 분류 → pgvector 벡터 검색 → RAG 합성/리랭킹** 3단계로 도서를 추천하는 모듈입니다. 일괄 응답과 SSE 스트리밍 두 가지 형태로 제공합니다.

---

## 폴더 구조

```
search/
├── search.module.ts
├── controllers/
│   └── search.controller.ts       # POST /search/ai, POST /search/ai/stream
├── services/
│   ├── search.service.ts          # 파이프라인 오케스트레이션 + AI 요청 로깅
│   ├── rag.service.ts             # Gemini 호출 (의도 분류 / 합성 / 파라메트릭 추천)
│   ├── embedding.service.ts       # gemini-embedding-001 768차원 임베딩 + L2 정규화
│   └── vector-search.service.ts   # match_books RPC 호출
├── prompts/
│   └── curator-prompts.ts         # 큐레이터 페르소나 및 합성 프롬프트
├── dtos/
│   └── ai-search.dto.ts
└── utils/
    ├── sse-stream-writer.ts       # SSE 이벤트 직렬화 (spec 있음)
    └── book-deduplicator.util.ts  # 제목 정규화 기반 중복 도서 제거 (spec 있음)
```

---

## API 엔드포인트

| 메서드 | 경로                | 인증   | Rate Limit | 설명                     |
| ------ | ------------------- | ------ | :--------: | ------------------------ |
| POST   | `/search/ai`        | 🔒 JWT |  10회/분   | 추천 결과를 한 번에 반환 |
| POST   | `/search/ai/stream` | 🔒 JWT |  10회/분   | SSE로 단계별 스트리밍    |

두 엔드포인트 모두 **회원 전용**입니다. LLM 호출 비용이 발생하므로 엔드포인트 단위 Throttler를 별도로 적용했습니다.

---

## 파이프라인

```
사용자 메시지 + 대화 이력
      │
      ▼
[1] RagService.processConversationalTurn
    Gemini Flash + Function Calling (search_books 도구)
    → 도구를 호출하면 searchQuery 생성, 아니면 꼬리 질문 텍스트 반환
      │
      ▼
[2] EmbeddingService.generateQueryEmbedding
    gemini-embedding-001 (RETRIEVAL_QUERY, outputDimensionality: 768)
    → 768차원 검증 후 L2 정규화
      │
      ▼
[3] VectorSearchService.searchSimilarBooks
    match_books(vector, matchCount) RPC 호출
    → 코사인 유사도 상위 후보. 임계값 미만 사전 필터링
      │
      ▼
[4] deduplicateBooks — 제목 정규화 기반 중복 판본 제거
      │
      ▼
[5] RagService.filterAndSynthesizeRecommendation
    후보 목록 + 대화 맥락 → 실제로 부합하는 도서만 엄선
    → 서두 메시지 + 책별 reason을 JSON으로 생성
```

- **[1]에서 검색 의도가 없다고 판단되면** 벡터 검색을 건너뛰고 대화 응답만 반환합니다. 불필요한 임베딩·검색 비용을 막습니다.
- **벡터 검색 결과가 비면** `generateParametricRecommendation`으로 모델 파라메트릭 지식 기반 추천을 시도합니다.
- `match_books` 호출은 `vector` 타입 캐스팅 형태를 순차적으로 시도합니다(`$1`, `$1::extensions.vector`, `$1::vector`). Supabase의 `extensions` 스키마 배치와 로컬 pgvector 설치 위치가 달라서 생기는 차이를 흡수하기 위한 처리이며, 모두 실패하면 빈 목록을 반환하고 경고를 남깁니다.

---

## SSE 이벤트 규격

`SseStreamWriter`가 아래 이벤트를 순서대로 내보냅니다.

| `type`      | 페이로드  | 시점                           |
| ----------- | --------- | ------------------------------ |
| `searching` | `message` | 의도 분류 완료, 벡터 검색 시작 |
| `books`     | `books[]` | 후보 도서 카드 확정            |
| `text`      | `chunk`   | 추천 문구를 조각 단위로 전송   |
| `error`     | `message` | 파이프라인 실패                |
| `done`      | —         | 스트림 종료                    |

웹에서는 `apps/web/src/features/book/utils/sse-chat-client.ts`가 이 이벤트를 파싱합니다.

---

## AI 요청 로깅

모든 LLM/임베딩 호출은 `AiRequestLog`(`llm` 모듈 엔티티)에 기록됩니다 — 모델명, 토큰 사용량, 응답 지연시간, 성공/실패. 비용 추적과 회귀 분석의 근거 데이터입니다.

---

## 관련 환경 변수

| 변수                      | 기본값                  | 설명                                                                                                        |
| ------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`          | —                       | 필수                                                                                                        |
| `GEMINI_MODEL_NAME`       | `gemini-3.1-flash-lite` | 의도 분류·합성에 쓸 Gemini 모델. 호출이 실패하면 `gemini-2.5-flash-lite`로 한 번 더 시도 (`rag.service.ts`) |
| `AI_SIMILARITY_THRESHOLD` | `0.35`                  | 최소 코사인 유사도 (높을수록 엄격)                                                                          |
| `AI_CANDIDATE_POOL_SIZE`  | `30`                    | pgvector 원시 후보 풀 크기                                                                                  |

## 사전 준비 (DB)

- `pgvector` 확장과 도서 임베딩 컬럼
- `match_books(query_embedding vector, match_count int)` RPC 함수
- 임베딩 적재는 별도 배치로 수행하며, 이 모듈은 조회만 담당합니다.
