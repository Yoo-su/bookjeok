# Search Feature (RAG 기반 AI 도서 검색)

자연어 질문을 받아 **의도 분류 → pgvector 벡터 검색 → RAG 합성/리랭킹** 3단계로 도서를 추천하는 모듈입니다. 일괄 응답과 SSE 스트리밍 두 가지 형태로 제공합니다.

> **UI 비노출, 서버·DB 유지(2026-09-29).** 웹 검색 화면의 AI 추천 탭을 숨겼습니다. 모듈과 엔드포인트는 그대로입니다.

---

## 폴더 구조

```
search/
├── search.module.ts
├── controllers/
│   └── search.controller.ts       # POST /search/ai, POST /search/ai/stream, GET /search/preview
├── services/
│   ├── search-preview.service.ts  # 상단바 통합 검색 미리보기
│   ├── search.service.ts          # 파이프라인 오케스트레이션 + AI 요청 로깅
│   ├── rag.service.ts             # Gemini 호출 (의도 분류 / 합성 / 파라메트릭 추천)
│   ├── embedding.service.ts       # gemini-embedding-001 768차원 임베딩 + L2 정규화
│   └── vector-search.service.ts   # match_books RPC 호출
├── prompts/
│   └── curator-prompts.ts         # 큐레이터 페르소나 및 합성 프롬프트
├── dtos/
│   └── ai-search.dto.ts
└── utils/
    ├── search-preview-sql.ts      # 미리보기 SQL·검색어 분리·미리보기 문장 (spec·PGlite 검증 있음)
    ├── sse-stream-writer.ts       # SSE 이벤트 직렬화 (spec 있음)
    └── book-deduplicator.util.ts  # 제목 정규화 기반 중복 도서 제거 (spec 있음)
```

---

## API 엔드포인트

| 메서드 | 경로                | 인증   | Rate Limit | 설명                      |
| ------ | ------------------- | ------ | :--------: | ------------------------- |
| POST   | `/search/ai`        | 🔒 JWT |  10회/분   | 추천 결과를 한 번에 반환  |
| POST   | `/search/ai/stream` | 🔒 JWT |  10회/분   | SSE로 단계별 스트리밍     |
| GET    | `/search/preview`   | 공개   |  240회/분  | 상단바 통합 검색 미리보기 |

AI 두 엔드포인트는 **회원 전용**입니다. LLM 호출 비용이 발생하므로 엔드포인트 단위 Throttler를 별도로 적용했습니다.

---

## 통합 검색 미리보기 (`GET /search/preview?q=`)

웹 상단바 검색창이 입력 중에 부릅니다(200ms 쉬었다 호출). 계약은 `@bookjeok/core`의 `SearchPreview`.

| 영역   | 건수 | 찾는 방법                                                                                                   |
| ------ | ---- | ----------------------------------------------------------------------------------------------------------- |
| 도서   | 4    | `BookCatalogService.search({ discovery: false })`. 도서 검색과 같은 서지 관련도 경로에서 소개 전문검색만 끔 |
| 리뷰   | 3    | 공개 리뷰. 제목·책 제목·태그·작성자·본문                                                                    |
| 판매글 | 3    | 판매중·예약중만. 제목·책 제목·저자·본문                                                                     |

- 검색어는 공백으로 나눠 앞뒤 기호를 뗀 뒤 최대 5단어(`previewTerms`). 2글자 미만이면 DB를 부르지 않고 빈 결과.
- 리뷰·판매글은 **모든 단어가 어느 필드에든 맞아야** 한다(AND). 점수는 단어별로 걸린 필드 중 가장 높은 가중치의 합(리뷰: 제목 8 · 책 제목 4 · 태그 3 · 작성자 2 · 본문 1 / 판매글: 제목 8 · 책 제목 4 · 저자 3 · 본문 1). 같은 점수면 최신순(판매글은 판매중 먼저).
- 리뷰 본문은 HTML이라 태그를 지우고 엔티티를 푼 순수 텍스트에서 찾는다(`REVIEW_TEXT_SQL`). HTML에 바로 `ILIKE`를 걸면 `strong` 검색이 공개 리뷰 74건 중 62건에 걸렸다(실제 글자 0건).
- 태그는 조인하지 않고 하위 질의로 이어 붙인다. 조인하면 행이 태그 수만큼 불어난다.
- `%`·`_`는 이스케이프해 글자로 찾는다.
- 도서 결과에는 책별 공개 리뷰 수·판매중/예약중 판매글 수를 붙인다(isbn 인덱스).

**인덱스를 걸지 않은 이유**: 공개 리뷰·판매글이 아직 수십 건이라 플래너가 인덱스를 써도 훑는 쪽을 고른다. 리뷰가 수천 건이 되거나 응답이 50ms를 넘으면 순수 텍스트 컬럼을 두고 `pg_trgm` GIN 인덱스를 건다(DDL 로그에 기록).

SQL은 `test/search-preview-sql.native.ts`가 PGlite(실제 PostgreSQL)에서 검증한다.

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
