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
│   ├── use-recent-book-store.ts      # 최근 본 책 (Zustand + 스토리지 영속화)
│   └── use-book-search-ui-store.ts   # 히어로 검색창 가림 여부 (폼 ↔ 결과 뷰 공유)
├── utils/
│   └── sse-chat-client.ts            # SSE 스트림 파서
├── constants/
│   └── ai-chat.ts
└── components/
    ├── book-search/
    │   ├── search-hero.tsx
    │   ├── search-hero.module.css, search-hero-tokens.css
    │   ├── book-search-form.tsx           # 히어로 검색창·인기검색어
    │   ├── book-search-input.tsx
    │   ├── floating-book-search-bar.tsx (+ stories)  # 스크롤 시 하단 검색 알약
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

### 검색 영상 히어로

오리 탐정이 책을 찾는 10초 애니메이션을 한 번 재생하고 마지막 프레임에 머뭅니다. 첫·끝 장면이 달라 자동 반복은 하지 않으며, 재생 중 일시정지·재개만 제공하고 종료 후 버튼을 숨깁니다. 재생 완료는 같은 탭의 세션에 기억해 검색 파라미터가 바뀌거나 새로고침해 히어로가 다시 마운트돼도 영상을 재생하지 않고 마지막 장면 이미지를 보여 줍니다. 밝은 흑백 스케치 영상 위에 균일한 15% 어둡게 하기 레이어(영화관 톤)를 깔고, 그 위에 중고마켓과 같은 하단 그라데이션·비네트·필름 그레인을 겹칩니다. 데스크톱은 제목과 검색창을 영상 위 왼쪽 하단에 겹칩니다. 모바일(640px 미만)은 겹치면 첫 장면의 오리를 가리므로 4:3 영상을 위에 두고 아래쪽을 검은 배경으로 페이드시켜 그 아래에 제목과 검색창을 놓으며, 재생 버튼은 영상 우측 상단으로 옮깁니다. 인기검색어는 검색창 아래에 실제 API 데이터 상위 3개를 정적인 검색 버튼으로 표시하며, 데이터가 없으면 숨깁니다.

히어로 검색창은 작은 모서리 반경의 직사각형으로 알약형 앱 헤더와 구분합니다. 별도의 검색 버튼 없이 Enter로 검색하며 `type="search"`·`enterKeyHint="search"`로 모바일 키보드에도 검색 액션을 제공합니다. 브라우저 기본 초기화 아이콘 대신 다크 그레이 버튼을 사용해 입력값을 지웁니다. ### 하단 검색 알약

히어로 검색창이 헤더 뒤로 스크롤되면 화면 하단 가운데에 검색 알약이 떠오릅니다. 상단에 두면 알약형 헤더와 두 알약이 겹쳐 쌓이고 그 사이로 본문이 비치므로 하단에 둡니다. 알약에는 맨 위로 버튼이 들어 있어 이 페이지는 공용 `ScrollTopButton`을 쓰지 않습니다. 결과 목록 끝에 닿으면 푸터를 가리지 않도록 맨 위로 버튼만 남깁니다. 알약에서 검색하면 결과 목록 맨 위로 스크롤합니다.

- 히어로 폼과 결과 뷰는 서로 다른 Suspense 경계라 가림 여부를 `use-book-search-ui-store`로 공유합니다.
- 우하단 채팅 버튼(로그인 시)과 좌하단 음악 알약(재생 중)은 전역 요소라 뷰가 상태만 읽어 피해 갑니다. 모바일에서는 채팅 버튼 자리를 비우고, 음악 재생 중에는 lg 미만에서 음악 알약 위로 올라갑니다.
- 블러(`backdrop-filter`)와 페이드(opacity)는 같은 요소에 둡니다. 조상에 opacity를 걸면 페이드 중 블러가 끊겼다가 끝에 한 번에 켜집니다.
- 다음 페이지는 바닥 600px 전에 미리 불러와 로딩 표시가 알약에 가리지 않게 합니다.

`public/videos/bookjeok_search_hero_v3.mp4`는 원본(1080p·9.8Mbps·오디오 포함, 12.3MB)을 오디오 제거·H.264 High·720p·CRF 26·`-tune animation`·faststart로 다시 인코딩한 1.9MB 파일입니다. `bookjeok_search_hero_v3_poster.jpg`는 첫 프레임, `bookjeok_search_hero_v3_end.jpg`는 마지막 프레임이며 인코딩된 영상에서 뽑아 영상과 전환될 때 화질 차이가 없습니다. `/videos`는 30일 캐시(`next.config.ts`)라 영상을 교체할 때 같은 파일명에 덮어쓰면 재방문자가 옛 영상을 보므로 파일명을 바꿉니다. 포스터를 우선 로드하며, 동작 줄이기·데이터 절약·느린 연결에서는 자동으로 영상 소스를 연결하지 않습니다. 화면 밖·백그라운드에서는 정지하고 자동재생 차단·영상 오류에는 포스터를 유지합니다. 사용자 요청으로는 직접 재생할 수 있습니다.

제목과 포스터는 SSR HTML에 남기고 URL을 읽는 `book-search-form`만 별도의 Suspense 경계에 둡니다. 영상 재생을 기다리지 않고 검색할 수 있으며, 기존 URL 검색·하단 검색 알약·인기 검색어·결과 목록 동작을 유지합니다.

### 홈 메인 슬라이더

출판사별 도서 18권을 3D 실린더로 보여줍니다. R2 표지는 `next/image`의 이미지 최적화 경로에서 화면 크기에 맞게 변환합니다. 처음 보이는 정면과 양옆 카드는 즉시 요청하고 나머지는 지연 로딩합니다. 호버·포커스·드래그가 시작되면 진행 중인 자동 회전을 멈춥니다.

### AI 대화형 추천 (SSE)

> **UI 비노출, 서버·DB 유지(2026-09-29).** 검색 화면에서 탭을 뺐고 `?mode=ai`도 키워드 검색으로 보입니다. 아래 컴포넌트·훅은 되살릴 때를 위해 남겨 두었습니다.

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

`use-recent-book-store`는 Zustand persist로 브라우저 **sessionStorage**(키 `recent-books`, `RECENT_BOOKS_KEY`)에 저장합니다. 탭을 닫으면 사라지고 로그아웃 시 `clearAuth()`가 지웁니다. 서버 상태가 아니므로 React Query가 아닌 클라이언트 스토어를 사용합니다.

## 3. SEO

`book-json-ld`가 도서 상세에 `Book` 구조화 데이터를 삽입합니다. 메타데이터는 `app/[locale]/book/[isbn]/detail` 라우트에서 생성합니다. 상세는 첫 요청에 생성한 뒤 30일 ISR을 사용합니다. 전체 번역 사전은 공통 정적 JS에서 제공하여 ISBN별 HTML/RSC에 반복 포함하지 않습니다. 없는 하위 경로는 미들웨어가 빈 404로 종료하고, 정상 ISBN의 존재 여부는 기존 상세 조회에서 판별합니다.

## 4. 관련

- 서버: [`features/book`](../../../../server/src/features/book/README.md), [`features/search`](../../../../server/src/features/search/README.md), [`features/llm`](../../../../server/src/features/llm/README.md)
- 뷰: `views/book-search-view`, `views/book-detail-view`
