# Frontend Feature: Book

도서 검색, 도서 상세, 인기 도서, 최근 본 책, AI 도서 요약, AI 대화형 추천, 인기 검색어를 담당합니다. 중고책 판매 로직은 [`book-sale`](../book-sale/README.md)로 분리되어 있습니다.

> **데이터 훅은 이 폴더에 없습니다.** 쿼리/뮤테이션 훅은 전부 `@bookjeok/react-query`에, API 호출 함수는 `@bookjeok/api-client`에, 타입·쿼리 키는 `@bookjeok/core`에 있습니다. 이 폴더에는 UI와 화면 전용 로직만 둡니다.

## 1. 폴더 구조

```
book/
├── apis/
│   └── server.ts                     # 서버 컴포넌트 전용 페칭 래퍼
├── queries/
│   └── prefetch.ts                   # RSC에서 React Query 캐시 prefetch
├── hooks/
│   ├── use-ai-chat.ts                # AI 추천 챗 상태 머신 (SSE 소비)
│   ├── use-book-search-params.ts     # 검색 조건 ↔ URL 쿼리스트링 동기화
│   └── use-book-view.ts              # 상세 진입 시 조회수 기록
├── stores/
│   └── use-recent-book-store.ts      # 최근 본 책 (Zustand + 스토리지 영속화)
├── utils/
│   └── sse-chat-client.ts            # SSE 스트림 파서
├── constants/
│   └── ai-chat.ts
└── components/
    ├── book-search/
    │   ├── search-hero.tsx
    │   ├── book-search-input.tsx
    │   ├── sticky-book-search-bar.tsx
    │   ├── search-mode-tabs.tsx          # 키워드 검색 ↔ AI 추천 전환
    │   ├── ai-chat-window.tsx (+ stories)
    │   ├── ai-book-recommend-slider.tsx
    │   ├── popular-keywords/
    │   └── book-search-result-list/      # index + skeleton
    ├── book-detail/
    │   ├── index.tsx, book-info.tsx, book-cover.tsx, book-description.tsx
    │   ├── book-actions.tsx              # 읽었어요(독서 기록)·위시리스트 등 액션
    │   ├── ai-summary.tsx                # AI 3단 요약 카드
    │   ├── related-books-section.tsx
    │   └── skeleton.tsx, error.tsx
    ├── book-slider/
    │   ├── main-book-slider.tsx, popular-book-slider.tsx, skeleton.tsx
    ├── recent-books/
    │   └── recent-books-drawer.tsx
    └── common/
        ├── book-card.tsx (+ stories)
        ├── book-search-modal/            # 리뷰·판매글 작성 시 도서 선택
        └── book-json-ld/                 # 구조화 데이터 (SEO)
```

## 2. 핵심 로직

### AI 대화형 추천 (SSE)

`search-mode-tabs`에서 AI 모드로 전환하면 `ai-chat-window`가 열리고, `use-ai-chat`이 대화 상태를 관리합니다. 전송은 `POST /search/ai/stream`이며 `sse-chat-client`가 스트림을 파싱합니다.

```
사용자 입력
  │
  ▼ use-ai-chat.send()
sse-chat-client ──▶ POST /search/ai/stream (fetch + ReadableStream)
  │
  ├─ type: "searching"  → "책을 찾는 중" 상태 표시
  ├─ type: "books"      → ai-book-recommend-slider에 후보 카드 렌더
  ├─ type: "text"       → 추천 문구를 조각 단위로 이어붙여 타이핑 효과
  ├─ type: "error"      → 에러 말풍선
  └─ type: "done"       → 스트림 종료, 입력 재활성화
```

`EventSource`가 아니라 `fetch` + `ReadableStream`을 쓰는 이유는 **POST 본문과 Authorization 헤더**가 필요하기 때문입니다(`EventSource`는 GET만 지원). 회원 전용 기능이라 인증 헤더가 필수입니다.

### 도서 상세 진입

1. RSC에서 `queries/prefetch.ts`로 상세·요약을 미리 채워 하이드레이션 후 즉시 렌더
2. `use-book-view`가 백그라운드로 조회수 기록(`POST /book/:isbn/view`)
3. `use-recent-book-store`에 최근 본 책으로 적재 → `recent-books-drawer`가 전역에서 노출
4. `ai-summary`가 캐시된 AI 요약을 조회, 없으면 생성 요청

### 검색 파라미터

`use-book-search-params`가 검색어·정렬·필터를 URL 쿼리스트링과 동기화합니다. 새로고침·뒤로가기·링크 공유에서 동일한 결과가 재현되고, 무한 스크롤 목록은 `@bookjeok/react-query`의 무한 쿼리 훅이 담당합니다. 검색 실행 시 인기 검색어 집계를 위해 검색어 기록 API를 함께 호출합니다.

### 최근 본 책

`use-recent-book-store`는 Zustand persist로 브라우저 스토리지에 저장합니다. 서버 상태가 아니므로 React Query가 아닌 클라이언트 스토어를 사용합니다.

## 3. SEO

`book-json-ld`가 도서 상세에 `Book` 구조화 데이터를 삽입합니다. 메타데이터는 `app/[locale]/book/[isbn]/detail` 라우트에서 생성합니다. 상세는 첫 요청에 생성한 뒤 30일 ISR을 사용합니다. 전체 번역 사전은 공통 정적 JS에서 제공하여 ISBN별 HTML/RSC에 반복 포함하지 않습니다. 없는 하위 경로는 미들웨어가 빈 404로 종료하고, 정상 ISBN의 존재 여부는 기존 상세 조회에서 판별합니다.

## 4. 관련

- 서버: [`features/book`](../../../../server/src/features/book/README.md), [`features/search`](../../../../server/src/features/search/README.md), [`features/llm`](../../../../server/src/features/llm/README.md)
- 뷰: `views/book-search-view`, `views/book-detail-view`
