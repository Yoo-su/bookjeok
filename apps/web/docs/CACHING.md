# 캐싱 구조

한 번의 방문이 통과하는 캐시는 넷입니다. 각 층은 서로의 존재를 모르고 TTL도 제각각이라, **어느 층이 무엇을 책임지는지**를 먼저 정해두지 않으면 쓰기 후 갱신이 조용히 어긋납니다.

## 층과 책임

| 층                   | 위치          | TTL                | 책임                                                          |
| -------------------- | ------------- | ------------------ | ------------------------------------------------------------- |
| 모듈 레벨 Map        | 서버 프로세스 | 10분               | 알라딘 호출 중복 제거 (`features/book/apis/server.ts`)        |
| ISR Full Route Cache | Next 서버     | 5분~24시간         | 차가운 트래픽·크롤러용 HTML. `dehydrate()` 결과가 여기 구워짐 |
| Router Cache         | 브라우저      | 서버 액션이 무효화 | SPA 재진입 시 재사용되는 RSC 페이로드                         |
| TanStack Query       | 브라우저      | 기본 1분           | **상호작용 중인 사용자의 신선도**                             |

핵심 원칙 하나:

> **ISR은 첫 페인트와 크롤러를 책임지고, TanStack Query는 세션 신선도를 책임진다.**
> 하이드레이트된 데이터는 진실이 아니라 **출발점**이다.

ISR HTML에 구워진 스냅샷은 최대 `revalidate`만큼 과거입니다. 그래서 전역 기본값이 `refetchOnMount: true`이고, 클라이언트는 마운트할 때마다 그 스냅샷을 교정합니다.

## 전역 기본값

`src/shared/libs/query-client.ts`

```ts
staleTime: CACHE_TIME.ONE_MINUTE,
refetchOnMount: true,
gcTime: CACHE_TIME.THIRTY_MINUTES,
retry: 1,
refetchOnWindowFocus: false,
```

`refetchOnMount`는 staleness와 무관한 **절대 게이트**입니다. `false`로 두면 `invalidateQueries`가 비활성 쿼리에 플래그만 세우고 끝나, 그 쿼리가 다시 마운트돼도 낡은 데이터가 그대로 그려집니다. 이 값을 다시 `false`로 되돌리지 마세요. 회귀 테스트는 `src/shared/libs/__tests__/query-client.test.tsx`에 있습니다.

개별 쿼리에서 `staleTime`을 덮어쓰는 건 자유롭습니다. 진짜 변하지 않는 데이터(AI 도서 요약 등)는 `staleTime: Infinity`가 정답입니다.

## 표면 대장

서버가 구워서 클라이언트로 넘기는 캐시 항목의 전부입니다. **이 목록 밖의 쿼리는 ISR과 얽히지 않습니다.**

| 시드 키                          | 굽는 라우트           | ISR TTL | staleTime                        |
| -------------------------------- | --------------------- | ------- | -------------------------------- |
| `bookSale.recentSales(25)`       | `/`                   | 1시간   | 전역 (마켓 히어로만 60초 + 폴링) |
| `book.popularBooks`              | `/`                   | 1시간   | 전역                             |
| `review.list({page:1,limit:5})`  | `/`                   | 1시간   | 전역                             |
| `book.list(출판사, 18)`          | `/`                   | 1시간   | 5분                              |
| `readingLog.loungePopular`       | `/` · `/lounge`       | 1시간   | 5분                              |
| `readingLog.loungeActiveReaders` | `/lounge`             | 1시간   | 5분                              |
| `insights.all`                   | `/insights`           | 6시간   | 전역                             |
| `bookSale.popularSales`          | `/book/market`        | 1시간   | 전역                             |
| `bookSale.marketSales({})`       | `/book/market`        | 1시간   | 전역                             |
| `review.popular`                 | `/book/reviews`       | 1시간   | 전역                             |
| `review.feeds()`                 | `/book/reviews`       | 1시간   | 전역                             |
| `book.popularKeywords`           | `/book/search`        | 1시간   | 호출부 지정                      |
| `user.publicProfile(handle)`     | `/users/[handle]`     | 10분    | 전역                             |
| `book.detail(isbn)`              | `/book/[isbn]/detail` | 24시간  | 5분                              |
| `book.summary(isbn)`             | `/book/[isbn]/detail` | 24시간  | Infinity (불변)                  |
| `review.detail(id)`              | `/book/reviews/[id]`  | 1시간   | 전역                             |
| `bookSale.saleDetail(id)`        | `/book/sales/[id]`    | 5분     | 전역                             |

`readingLog.loungePopular`는 두 라우트가 각각 독립된 시각에 굽습니다. 방문 순서에 따라 더 최신 스냅샷이 이깁니다 (`hydrate()`는 `dataUpdatedAt`이 더 클 때만 덮어씀).

## 재검증 범위 규칙

`src/shared/actions/revalidate.ts`

- **아이템 상세만 즉시 재검증한다.** 그 페이지의 주제가 바뀐 것이므로.
- **목록·홈 같은 집계는 시간 기반 `revalidate`에 위임한다.** 쓰기마다 파기하면 트래픽이 늘수록 적중률이 0에 수렴해 ISR이 사실상 SSR로 퇴화합니다. 상호작용 중인 사용자는 쿼리 무효화 + `refetchOnMount`로 이미 최신을 봅니다.
- **삭제만 예외로 집계까지 비운다.** 목록에 남은 링크가 404로 이어지기 때문입니다.

클라이언트 쿼리 무효화는 서버 캐시에 닿지 않습니다. 둘은 대체재가 아니라 **다른 대상**(본인 / 다른 방문자·크롤러)을 위한 별개 작업입니다.

브라우저 Router Cache는 또 별개라, 호출부는 `purgeRouteCache(재검증, () => router.refresh())`로 순서를 고정합니다. 역순이면 아직 파괴되지 않은 HTML을 다시 캐싱합니다.

## 목록 링크의 prefetch

`<Link>`의 기본 prefetch는 **뷰포트 진입만으로** 대상 라우트의 RSC 페이로드를 당겨옵니다. 대상이 ISR 라우트면 그 요청이 캐시 MISS가 되어 **재생성 → ISR 쓰기**로 이어집니다. 사용자가 클릭하지 않으면 그렇게 구운 엔트리는 한 번도 읽히지 않습니다.

2026-09-10 Vercel ISR 지표에서 `/book/[isbn]/detail`이 **쓰기 890건 / 고유 경로 466개 / 읽기 160회**였습니다. TTL이 24시간이라 경로당 쓰기는 1회가 상한인데 평균 1.9회였고, 읽기는 경로 수의 3분의 1이었습니다. 목록·슬라이더의 prefetch 팬아웃이 만든 숫자입니다.

그래서 규칙은 이렇습니다:

> **한 화면에 여러 개가 동시에 깔리는 링크는 `prefetch={false}`.**

| 컴포넌트                                               | 노출당 링크                      |
| ------------------------------------------------------ | -------------------------------- |
| `book/components/common/book-card`                     | 검색 결과 20 · 연관 도서 5~10    |
| `book/components/book-slider/main-book-slider`         | 홈 출판사 서가 18                |
| `book/components/book-slider/popular-book-slider`      | 홈 인기책 목록 2벌 + 히어로      |
| `book/components/book-search/ai-book-recommend-slider` | AI 추천 N                        |
| `book/components/recent-books/recent-books-drawer`     | 최근 본 책 N                     |
| `book-sale/components/common/book-sale-item/root`      | 마켓 무한목록 · 홈 최근 판매     |
| `review/components/common/review-card/root`            | 리뷰 목록 · 홈 리뷰 섹션         |
| `book-sale/.../market-hero/live-listing-feed`          | 실시간 피드 (60초 폴링마다 갱신) |

`popular-book-slider`의 히어로는 링크가 하나지만 `hoveredBook`으로 href가 바뀌므로, 순위 목록을 훑는 동작만으로 새 경로를 계속 굽습니다. 그래서 여기도 차단합니다.

**단일 문맥 링크는 기본값을 유지합니다** — 판매 상세의 도서 링크, 리뷰 상세의 도서 링크, 프로필 링크처럼 다음 목적지가 하나로 좁혀진 자리에서는 prefetch가 제값을 합니다. 로그인 뒤 마이페이지 목록(위시리스트·판매 내역·내 댓글)도 남겨뒀습니다. 트래픽이 낮고 본인 항목이라 클릭률이 높습니다.

### 지연은 `loading.tsx`가 가린다

prefetch를 끄면 클릭 시점에 페이로드를 받아오므로 수백 ms의 공백이 생깁니다. 이 저장소에는 전역 내비게이션 진행 표시기가 없어서, 그 구간이 **아무 반응 없음**으로 보입니다.

그래서 차단한 링크의 목적지 세 곳에 `loading.tsx`를 뒀습니다.

| 라우트                | 로딩 UI                                             |
| --------------------- | --------------------------------------------------- |
| `/book/[isbn]/detail` | `BookDetailSkeleton` + 연관 도서 5장 + AI 요약 블록 |
| `/book/sales/[id]`    | `BookSaleDetailSkeleton`                            |
| `/book/reviews/[id]`  | `ReviewDetailSkeleton`                              |

**컴포넌트가 이미 쓰는 스켈레톤을 그대로 재사용합니다.** 페이지 전용 스켈레톤을 새로 그리면 두 벌이 갈라지고, 전환 순간에 골격이 튑니다.

조건부로만 렌더되는 요소는 골격에 넣지 않습니다. 판매 상세의 지도·도서 정보 카드는 좌표가 없는 판매글에서 사라지므로, 자리를 잡아두면 오히려 레이아웃이 흔들립니다.

`loading.tsx`는 ISR 쓰기를 만들지 않습니다. prefetch는 지연을 **미리 구워서** 가렸고, 이쪽은 같은 일을 공짜로 합니다.

## 새 쿼리를 추가할 때

**서버에서 시드하지 않는 쿼리**(클라이언트에서만 조회)라면 신경 쓸 것이 없습니다. 그냥 추가하세요.

**서버에서 시드한다면** (`ServerQueryBoundary`의 `queries` 또는 `setQueryData`):

1. 위 표에 줄을 추가한다.
2. 그 데이터가 화면에 떠 있는 동안 바뀔 수 있는지 따진다. 바뀔 일이 없다면 **애초에 쿼리로 만들지 말고 서버 컴포넌트 props로 내리는 편**이 층을 하나 줄인다.
3. 쓰기 경로가 있다면 무효화 대상 키와 재검증 대상 경로를 함께 배선한다.
4. 쿼리 키는 반드시 `@bookjeok/core`의 키 팩토리에서 만든다. 팩토리 밖의 raw 키는 도메인 접두사 무효화에 걸리지 않는다.

## On-Demand 재검증 웹훅

`src/app/api/revalidate/route.ts` — POST 전용, 시크릿은 `x-revalidate-token` 헤더, ISR 라우트만 허용하는 경로 화이트리스트.

`REVALIDATE_TOKEN`은 **서버 전용**입니다. `NEXT_PUBLIC_` 접두사를 붙이면 브라우저 번들에 실려 공개됩니다. 폴백은 두지 않습니다 — 미설정 시 503으로 실패해 조용히 열려 있는 상태를 만들지 않습니다.
