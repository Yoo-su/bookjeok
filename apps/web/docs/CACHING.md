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
| `bookSale.recentSales(25)`       | `/`                   | 6시간   | 전역 (마켓 히어로만 60초 + 폴링) |
| `book.popularBooks`              | `/`                   | 6시간   | 전역                             |
| `review.list({page:1,limit:20})` | `/`                   | 6시간   | 전역                             |
| `book.list(출판사, 18)`          | `/`                   | 6시간   | 5분                              |
| `readingLog.loungePopular`       | `/` · `/lounge`       | 6시간   | 5분                              |
| `readingLog.loungeActiveReaders` | `/lounge`             | 6시간   | 5분                              |
| `insights.all`                   | `/insights`           | 6시간   | 전역                             |
| `bookSale.popularSales`          | `/book/market`        | 6시간   | 전역                             |
| `bookSale.marketSales({})`       | `/book/market`        | 6시간   | 전역                             |
| `review.popular`                 | `/book/reviews`       | 6시간   | 전역                             |
| `review.feeds()`                 | `/book/reviews`       | 6시간   | 전역                             |
| `book.popularKeywords`           | `/book/search`        | 6시간   | 호출부 지정                      |
| `user.publicProfile(handle)`     | `/users/[handle]`     | 1시간   | 전역                             |
| `book.detail(isbn)`              | `/book/[isbn]/detail` | 30일    | 5분                              |
| `book.summary(isbn)`             | `/book/[isbn]/detail` | 30일    | Infinity (불변)                  |
| `review.detail(id)`              | `/book/reviews/[id]`  | 24시간  | 전역                             |
| `bookSale.saleDetail(id)`        | `/book/sales/[id]`    | 1시간   | 전역                             |

홈의 `review.list`는 **화면에 5건만 보이지만 20건을 시드합니다.** 최신 리뷰 티커가 순환시킬 풀이라 그렇습니다. 개수는 `features/review/components/recent-review-list`의 `TICKER_POOL_SIZE`와 홈 페이지의 `queryFn`이 함께 가지며, 어긋나면 키가 달라져 시드가 통째로 버려집니다.

`readingLog.loungePopular`는 두 라우트가 각각 독립된 시각에 굽습니다. 스냅샷의 `dataUpdatedAt`은 0이라(아래 「시드의 시각 필드」) 이미 캐시에 있는 값을 덮지 않고, 먼저 들어온 값이 마운트 시 refetch로 교정됩니다.

### 시드의 시각 필드

`ServerQueryBoundary`는 `dehydrate()` 대신 `dehydrateStable()`을 씁니다. 시드 쿼리의 `dataUpdatedAt`·`dehydratedAt`을 0으로 고정합니다.

Vercel은 재검증 결과가 이전과 같으면 ISR 쓰기를 과금하지 않습니다. 시각이 섞이면 데이터가 그대로여도 매번 전체 크기만큼 쓰기가 잡힙니다. 2026-09-25 실측에서 최근 12시간 ISR 쓰기의 60%가 홈·목록 재생성이었습니다. 로컬 프로덕션 빌드에서 ISR 페이지 9종을 재검증 전후로 비교해 HTML·RSC가 바이트 단위로 같음을 확인했습니다.

- 클라이언트에서는 시드가 staleTime과 무관하게 stale로 복원돼 마운트 시 refetch됩니다. 원래도 스냅샷은 대개 staleTime보다 오래돼 있었으므로 동작 차이는 거의 없습니다. 예외는 staleTime이 `Infinity`인 쿼리로, 그대로 fresh입니다.
- `hydrate()`는 `dataUpdatedAt`이 더 클 때만 덮어쓰므로, 시드는 이미 캐시에 있는 데이터를 덮지 않습니다.
- promise가 달린 스트리밍 쿼리는 건드리지 않습니다. hydrate가 `dehydratedAt`으로 신선도를 판단하기 때문입니다.
- 렌더 결과에 `new Date()`·`Math.random()` 같은 비결정 값을 넣으면 이 효과가 사라집니다.

## 재검증 범위 규칙

`src/shared/actions/revalidate.ts`

- **아이템 상세만 즉시 재검증한다.** 그 페이지의 주제가 바뀐 것이므로.
- **목록·홈 같은 집계는 시간 기반 `revalidate`에 위임한다.** 쓰기마다 파기하면 트래픽이 늘수록 적중률이 0에 수렴해 ISR이 사실상 SSR로 퇴화합니다. 상호작용 중인 사용자는 쿼리 무효화 + `refetchOnMount`로 이미 최신을 봅니다.
- **삭제만 예외로 집계까지 비운다.** 목록에 남은 링크가 404로 이어지기 때문입니다.
- **생성은 재검증 대상이 없다.** 방금 만든 id의 상세 경로는 아직 ISR에 없어 비울 것이 없고, 집계는 위 규칙대로 시간 기반에 위임합니다. 판매글 생성이 `revalidateBookSale({ saleId })`를 부르고 있었는데, 그 호출은 서버 액션 왕복만 한 번 더 만들 뿐 아무것도 비우지 않았습니다 (2026-09-16 제거).

### 200을 404로 바꾸는 쓰기는 삭제와 같이 취급한다

회원 탈퇴가 그렇습니다. 소프트 삭제라 `/users/{handle}`은 곧바로 404가 되지만, **ISR에는 직전 200 HTML이 그대로 남아** 만료 시각(1시간)까지 방문자와 크롤러에게 탈퇴 회원의 프로필이 나갑니다. 그래서 `useWithdrawMutation`이 홈으로 떠나기 **전에** `revalidateUserProfile`을 기다립니다 — `window.location` 이동은 진행 중인 서버 액션을 끊습니다. 회귀 테스트는 `features/user/__tests__/mutations.test.tsx`에 있습니다.

핸들은 수정 대상이 아니므로(`UpdateUserDto`에 필드가 없습니다) 프로필 수정에서 옛 경로를 따로 좇을 필요는 없습니다. 핸들을 바꿀 수 있게 만든다면 **그때 이전 핸들 경로도 함께 비워야 합니다.**

클라이언트 쿼리 무효화는 서버 캐시에 닿지 않습니다. 둘은 대체재가 아니라 **다른 대상**(본인 / 다른 방문자·크롤러)을 위한 별개 작업입니다.

브라우저 Router Cache는 또 별개라, 호출부는 `purgeRouteCache(재검증, () => router.refresh())`로 순서를 고정합니다. 역순이면 아직 파괴되지 않은 HTML을 다시 캐싱합니다.

## 목록 링크의 prefetch

`<Link>`의 기본 prefetch는 **뷰포트 진입만으로** 대상 라우트의 RSC 페이로드를 당겨옵니다. 대상이 ISR 라우트면 그 요청이 캐시 MISS가 되어 **재생성 → ISR 쓰기**로 이어집니다. 사용자가 클릭하지 않으면 그렇게 구운 엔트리는 한 번도 읽히지 않습니다.

2026-09-10에는 `/book/[isbn]/detail`의 쓰기 890 / 고유 경로 466 / 읽기 160을 근거로 prefetch 팬아웃을 지적했습니다. **2026-09-20 정정:** ISR Reads/Writes가 8KB 단위인지 실행 횟수인지 구분하지 않고 이 비율만으로 재생성 횟수나 원인을 단정할 수 없습니다. 배포별 캐시와 HTML/RSC 표현도 구분해야 합니다. 목록 prefetch 차단은 클릭하지 않은 목적지의 요청 자체를 줄이는 정책으로 유지합니다.

그래서 규칙은 이렇습니다:

> **한 화면에 여러 개가 동시에 깔리는 링크는 `prefetch={false}`.**

| 컴포넌트                                               | 노출당 링크                       |
| ------------------------------------------------------ | --------------------------------- |
| `book/components/common/book-card`                     | 검색 결과 20 · 연관 도서 5~10     |
| `book/components/book-slider/main-book-slider`         | 홈 출판사 서가 18                 |
| `book/components/book-slider/popular-book-slider`      | 홈 인기책 목록 2벌 + 히어로       |
| `book/components/book-search/ai-book-recommend-slider` | AI 추천 N                         |
| `book/components/recent-books/recent-books-drawer`     | 최근 본 책 N                      |
| `book-sale/components/common/book-sale-item/root`      | 마켓 무한목록 · 홈 최근 판매      |
| `review/components/common/review-card/root`            | 리뷰 목록 · 홈 리뷰 섹션          |
| `review/components/recent-review-list/review-row`      | 홈 리뷰 티커 (20건이 차례로 통과) |
| `book-sale/.../market-hero/live-listing-feed`          | 실시간 피드 (60초 폴링마다 갱신)  |

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
않고, 쿼리만 바뀌는 이동은 진행 중 URL 변화를 확인합니다. Next `Link`는 정상적인
클라이언트 이동에도 `preventDefault()`를 호출하므로 클릭 이벤트의 `defaultPrevented`
여부로 이 클릭을 걸러서는 안 됩니다. 앵커가 없는 캔버스 클릭처럼 `router.push()`로
직접 이동하는 곳은 `signalNavigationStart()`를 호출해 같은 표시기를 시작합니다.
표시기가 라우트 트리 밖에 있어 Suspense 경계를 만들지 않고 응답 상태에 관여하지 않습니다.
막대의 중간 값은 실제 네트워크 전송률이 아니라 대기 피드백이며, 경로 변경 시 완료됩니다.
Swiper가 드래그 클릭을 취소한 경우에는 막대를 띄우지 않습니다.

## 크롤 표면

**CDN HIT와 durable ISR 저장소 읽기는 다릅니다.** CDN 계층 읽기·쓰기는 무료이고, durable ISR 접근은 8KB 단위로 계량됩니다. `x-vercel-cache: HIT`만으로 청구 단위를 계산하지 마세요. [Vercel ISR 과금](https://vercel.com/docs/incremental-static-regeneration/limits-and-pricing)을 기준으로 경로별 단위와 실행 횟수를 구분합니다.

**미들웨어는 ISR 캐시 조회와 페이지 렌더보다 먼저 돕니다.** 여기서 끊으면 후속 페이지 렌더와 ISR 접근을 피하지만 미들웨어 자체의 실행 비용은 남습니다. 전체 경로 형태를 `PATHS`에서 파생해 검사하므로 `/ko/book/not-a-route`처럼 알려진 루트 아래의 잘못된 경로도 빈 404로 종료합니다. 실제 `page.tsx` 전체와 허용 목록의 일치는 회귀 테스트로 확인합니다.

| 장치                              | 위치                                  | 막는 것                                       |
| --------------------------------- | ------------------------------------- | --------------------------------------------- |
| `isBlockedCrawler`                | `middleware.ts`                       | 검색 유입 없는 크롤러. 렌더 없이 403          |
| 전체 라우트 형태 허용 목록         | `middleware.ts`                       | `/ko/wp-admin` 류. `[...not_found]` 렌더 차단 |
| 파일형 루트 경로 차단             | `middleware.ts`                       | `/index.php`·`/.env` 류. `[locale]` 렌더 차단 |
| `isValidIsbn` (미들웨어 + 라우트) | `middleware.ts`, 도서 상세 `page.tsx` | 형식이 틀린 ISBN. 렌더 없이 404               |
| 숫자 id 가드                      | 리뷰·판매 상세 `page.tsx`             | `/reviews/abc` 류. 400이 500으로 새는 것 방지 |
| `ZERO_VALUE_CRAWLERS`             | `app/robots.ts`                       | 위 차단 목록의 사전 고지 (강제는 미들웨어)    |

### 미들웨어 matcher의 확장자 목록은 좁게 유지한다

matcher가 `.*\..*`로 "점이 있으면 제외"였을 때, `/index.php`·`/.env` 같은 스캐너 경로가
미들웨어를 건너뛰고 `[locale]`까지 들어갔습니다. `[locale]`은 `dynamicParams`가 열려 있어
`.env`를 로케일 파라미터로 받고, **249KB짜리 not-found를 렌더한 뒤 ISR 엔트리로 남겼습니다.**
경로 공간이 무한합니다.

확장자 목록은 `public/`과 라우트 핸들러가 **실제로 서빙하는 것만** 적으세요. 방어적으로
넓히면 그만큼 구멍이 다시 열립니다 (`.json`을 넣었더니 `/config.json`이 25KB를 렌더했습니다).

> **`[locale]/layout.tsx`에 `dynamicParams = false`를 넣지 마세요.** 막힐 것 같지만
> 도서·리뷰·판매·프로필 상세가 전부 404가 됩니다. Next는 라우트의 `dynamicParams`를
> `segments.every((s) => s.config?.dynamicParams !== false)`로 계산하므로, 상위 레이아웃의
> `false`가 체인 전체를 `FallbackMode.NOT_FOUND`로 만들고 하위의 `true`가 이를 덮지 못합니다
> (`next/dist/build/static-paths/app.js`, "granular per segment"는 미지원이라는 주석이 있습니다).

### 크롤러 차단 목록은 한 곳에서 관리한다

`shared/config/crawlers.ts`가 robots.txt와 미들웨어의 공통 출처입니다. robots.txt는 부탁이고
강제는 미들웨어가 합니다. **허용 목록이 항상 먼저** 평가됩니다 — `bot` 같은 느슨한 패턴이
Googlebot을 삼키면 색인 전체가 날아갑니다. 회귀 테스트는
`shared/config/__tests__/crawlers.test.ts`에 있습니다.

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

### 관계 누락도 같은 규칙을 받는다

배열뿐 아니라 **관계 객체**도 빠진 채로 내려온 적이 있습니다(`bc2bf9d2`·`eb6fd4d5`).
`review.book.title`·`sale.book.isbn`처럼 관계를 바로 파고들면 그 한 줄이 페이지를 500으로
만듭니다. 구조화 데이터 한 블록이 비는 것과 페이지가 통째로 죽는 것은 무게가 다릅니다.

- `generateMetadata`와 JSON-LD에서는 관계 블록을 **통째로 생략**하세요 (`...(book && {...})`)
- 하위 컴포넌트가 각자 방어하는 대신 **진입 지점에서 한 번 정규화**하세요
  (`sale-detail/book-sale-detail/index.tsx`가 그 형태입니다)

단, **스칼라 필드가 통째로 빠진 응답은 장애이고 5xx가 맞습니다.** `price`까지 기본값을 씌우면
틀린 화면을 조용히 내보내게 됩니다. 방어는 관계·배열까지입니다.

### `setRequestLocale` 누락은 라우트를 동적으로 떨어뜨린다

next-intl은 `setRequestLocale`이 없으면 헤더에서 로케일을 읽고, 그 순간 라우트가 동적이 됩니다.
정적이어야 할 페이지가 **요청마다 렌더**되어 Fluid 실행 시간을 먹습니다. 약관·개인정보·로그인
·회원가입이 이 상태였습니다. 새 페이지를 추가하면 `setRequestLocale(locale)`를 함께 넣고,
빌드 출력에서 `●`(SSG)로 찍히는지 확인하세요.

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

## 서버 시딩 실패 처리 (2026-09-19)

`ServerQueryBoundary`는 실패를 reject하는 `fetchQuery`/`fetchInfiniteQuery`를 병렬 실행하고 실패를 기록합니다. 마켓 기본 목록·리뷰 카테고리 피드·라운지 최신 피드는 `required: true`입니다. 이 쿼리가 실패하면 렌더 실패를 전파해 기존 정상 ISR을 유지하며, 최초 생성이라면 실패로 처리합니다. `[locale]/layout.tsx`의 `generateStaticParams: []`로 언어별 페이지의 빌드 시 사전 생성을 생략합니다. 마켓·리뷰 홈·라운지를 포함한 정적 페이지는 첫 방문에 생성하고 각 페이지의 `revalidate`를 유지하므로, 빌드 환경에 API 서버가 없어도 됩니다. 기존 동적 페이지의 요청별 렌더링은 유지됩니다. 배포 후 캐시가 없는 첫 요청은 생성 시간만큼 느릴 수 있습니다. 부가 쿼리는 성공한 나머지 데이터와 함께 폴백합니다.

라운지는 `readingLog.loungeFeed`의 첫 페이지를 `initialPageParam: null`로 시딩합니다(ISR 6시간, 클라이언트 staleTime 1분). sitemap은 `connection()`으로 빌드 시 API 조회를 생략합니다. 첫 요청부터 공개 리뷰·판매글을 50개씩 커서 순회하고 완성된 목록을 `unstable_cache`로 6시간 보관합니다. `next.config.ts`의 `/sitemap.xml` 전용 `Vercel-CDN-Cache-Control`로 XML 응답도 6시간 캐시합니다(만료 뒤 stale-while-revalidate 24시간). 이 헤더는 Vercel CDN 전용이고 preview는 no-store입니다. CDN MISS에서만 함수가 데이터 캐시를 읽어 XML을 직렬화합니다. 데이터·응답 캐시의 만료 시각이 다르므로 목록의 실제 신선도가 정확히 6시간 이내라는 보장은 하지 않습니다. 정상 데이터 캐시가 있으면 재검증 실패 시에도 기존 목록을 제공합니다. 최초 조회가 실패하면 오류를 반환합니다. 중간 API 실패·반복 커서는 부분 결과를 저장하지 않고 전파합니다. 단일 sitemap 5만 URL 한도를 넘기기 전에 분할해야 하며, 무한 순회 방지를 위해 글 수 약 2.5만에서 가드를 둡니다.


## 번역 사전 전송 (2026-09-20)

`[locale]/layout.tsx`의 서버 `NextIntlClientProvider`는 `messages={null}`로 locale·시간 설정만 전달합니다. 내부 `IntlMessagesProvider`가 한·영 사전을 정적 import하여 SSR과 브라우저에서 같은 번역을 제공합니다. 79KB의 한국어 사전이 ISBN마다 HTML/RSC에 반복 포함되던 것을 공통 정적 JS로 옮겼습니다. 두 언어 사전이 클라이언트 번들에 포함되는 대신 브라우저·CDN이 페이지 간 재사용합니다. 서버 `getTranslations`는 기존 request config를 그대로 사용합니다.

배포마다 새 ISR 캐시가 만들어지는 플랫폼 동작은 그대로입니다. 30일 TTL이 배포 간 페이지 재사용을 보장하지 않으며, 인기 페이지 사전 생성은 빌드 API 접근 조건을 갖춘 뒤 별도로 결정합니다.
