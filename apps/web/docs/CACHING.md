# 캐싱 구조

한 번의 방문이 통과하는 캐시는 넷입니다. 각 층은 서로의 존재를 모르고 TTL도 제각각이라, **어느 층이 무엇을 책임지는지**를 먼저 정해두지 않으면 쓰기 후 갱신이 조용히 어긋납니다.

## 층과 책임

| 층                   | 위치          | TTL                | 책임                                                          |
| -------------------- | ------------- | ------------------ | ------------------------------------------------------------- |
| 모듈 레벨 LRU        | 서버 프로세스 | 10분 / 항목 상한   | 백엔드 호출 중복 제거 (`features/book/apis/server.ts`)        |
| ISR Full Route Cache | Next 서버     | 1시간~30일         | 차가운 트래픽·크롤러용 HTML. `dehydrate()` 결과가 여기 구워짐 |
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
| `user.publicProfile(handle)`     | `/users/[handle]`     | 1시간   | 전역                             |
| `book.detail(isbn)`              | `/book/[isbn]/detail` | 30일    | 5분                              |
| `book.summary(isbn)`             | `/book/[isbn]/detail` | 30일    | Infinity (불변)                  |
| `review.detail(id)`              | `/book/reviews/[id]`  | 24시간  | 전역                             |
| `bookSale.saleDetail(id)`        | `/book/sales/[id]`    | 1시간   | 전역                             |

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

### 지연은 진행 표시기가 가린다 — `loading.tsx`는 쓰지 않는다

prefetch를 끄면 클릭 시점에 페이로드를 받아오므로 수백 ms의 공백이 생깁니다. 그 구간을
`loading.tsx`로 가리면 **404가 200이 됩니다.**

`loading.tsx`는 해당 세그먼트에 Suspense 경계를 만듭니다. 그러면 Next가 `notFound()`가
실행되기 전에 200 셸을 flush하고, 그 200이 그대로 ISR 캐시에 구워집니다. 도서 상세는
`dynamicParams`가 열려 있어 경로 공간이 사실상 무한하므로, 없는 ISBN 하나하나가 영구
엔트리가 됩니다. 검색엔진이 그 soft 404를 색인하면 크롤이 늘어 악순환이 됩니다.

2026-09-03에 이 이유로 상세 3개 라우트의 `loading.tsx`를 지웠는데, 2026-09-10에 prefetch를
끄면서 같은 자리에 다시 넣어 회귀했습니다. 운영에서 `/ko/book/9999999999999/detail`이
`200 + x-nextjs-prerender: 1`로 응답하는 것을 확인하고 2026-09-12에 되돌렸습니다.

> **상세 라우트에 `loading.tsx`를 두지 마세요.** 인증이 필요해 크롤되지 않는
> `reviews/[id]/edit`만 예외입니다.

대신 라우트 밖에서 지연을 가립니다 — `shared/components/navigation-progress.tsx`가
`[locale]/layout.tsx`에 상시 마운트돼 있습니다. 같은 출처 앵커 클릭을 듣고 막대를 띄우며,
`usePathname()`이 바뀌면 내립니다. `useSearchParams()`는 정적 렌더링을 무효화하므로 쓰지
않습니다. 라우트 트리 밖이라 Suspense 경계를 만들지 않고, 따라서 응답 상태에 관여하지 않습니다.

## 크롤 표면

ISR 쓰기와 Fluid 실행 시간은 **고유 경로 수**에 비례합니다. 경로 공간을 닫아두는 장치가 셋입니다.

| 장치                              | 위치                                  | 막는 것                                       |
| --------------------------------- | ------------------------------------- | --------------------------------------------- |
| `isValidIsbn` (미들웨어 + 라우트) | `middleware.ts`, 도서 상세 `page.tsx` | 형식이 틀린 ISBN. 렌더 없이 404               |
| 숫자 id 가드                      | 리뷰·판매 상세 `page.tsx`             | `/reviews/abc` 류. 400이 500으로 새는 것 방지 |
| `ZERO_VALUE_CRAWLERS`             | `app/robots.ts`                       | 검색 유입 없이 카탈로그를 훑는 봇             |

**부재는 404로, 장애는 5xx로 나가야 합니다.** 404는 캐시돼 재렌더를 막지만, 5xx는 ISR에
남지 않아 매 요청 재렌더됩니다. 그래서 부재(404 응답)와 장애(그 외)를 각 라우트의
`getCached*`에서 갈라둡니다.

`/en`은 `noindex, nofollow`이지만 robots.txt로 막지 않습니다. 수집을 끊으면 크롤러가 그
noindex를 읽지 못해 이미 색인된 페이지가 그대로 남습니다. 색인에서 빠진 뒤 `Disallow`로
전환하세요.

### 시드한 배열은 `Array.isArray`로 받는다

서버가 시드한 데이터를 소비할 때 이 저장소의 관용구는 `!x || x.length === 0`이었습니다.
이건 `undefined`만 막습니다. 백엔드가 형태가 어긋난 200을 주면 `{}`가 그대로 통과해
(`{}.length`는 `0`이 아니라 `undefined`) 바로 다음 줄의 `map`·`slice`·`filter`에서 터집니다.

터지면 **섹션 하나가 비는 게 아니라 페이지 전체가 500**이 됩니다. 그리고 500은 ISR에
남지 않으므로, 그 경로는 캐시 없이 매 요청 재렌더됩니다 — 지금 줄이려는 비용 그 자체입니다.

> **프리렌더되는 라우트에서 시드 배열을 쓸 때는 `Array.isArray`로 받으세요.**

훅은 조기 반환보다 먼저 돌기 때문에 렌더 가드만으로는 늦습니다. `useMemo`에서 가공한다면
**진입 지점에서 한 번 정규화**하세요 (`recent-sale-slider`가 그 형태입니다).

무한 쿼리의 `pages.flatMap((page) => page.items)`도 같습니다. `items`가 빠진 페이지가 하나라도
있으면 `undefined`가 항목으로 섞여 카드 컴포넌트에서 터집니다. `?? []`로 페이지 단위로 막으세요.

인증 뒤에서만 열리는 화면(채팅·마이페이지)은 이 규칙의 대상이 아닙니다. 프리렌더되지 않아
500이 나도 ISR 병리로 이어지지 않습니다.

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
