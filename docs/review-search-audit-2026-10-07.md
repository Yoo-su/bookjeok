# 도서 리뷰 검색 노출 점검

확인일: 2026-10-07 (한국 시간). 코드 기준: `70b69e97` 및 현재 작업 트리. 공개 HTTP GET, XML·HTML 파싱, 공식 검색엔진 가이드 비교로 점검했다. 서비스 코드·운영 DB·배포·검색엔진 제출 설정은 변경하지 않았다.

## 같은 날 후속 적용 — 작은 변경 우선

아래 점검 내용은 변경 전 상태다. 사용자의 후속 요청에 따라 공개 리뷰 검색 제목에 도서명 보충(이미 있는 책명은 중복 방지), RSS 공개 리뷰 본문 전체 제공을 적용했다. RSS는 상세의 HTML 정제기를 공유하고 비공개 리뷰를 명시적으로 제외한다. 화면 제목·URL·캐시 주기는 유지하며, IndexNow·서버 리뷰 링크·아카이브는 구현하지 않았다. 배포·검색엔진 제출은 수행하지 않았다.

검증: RSS·SEO JSON-LD/공유·메타데이터 테스트 34건 통과(워커 1개, 파일 병렬 실행 없음). 변경한 TypeScript 파일 5개의 ESLint와 `git diff --check` 통과. 전체 빌드는 실행하지 않았다. pnpm 런처가 버전 검증용 레지스트리에 접속하지 못해, 설치된 `node_modules/.bin`의 Vitest·Prettier·ESLint를 직접 실행했다.

## 같은 날 운영 재확인 — 네이버에 빠르게 알리기

후속 질문에 맞춰 현재 코드와 운영 공개 GET을 다시 대조했다. Yeti User-Agent를 사용했지만 실제 네이버 검색로봇의 IP에서 수집한 결과는 아니다. 계정의 색인·수집 지표와 배포 이력은 조회하지 않았다.

- `robots.txt` HTTP 200: 일반 크롤러를 허용하며 Yeti를 차단하는 규칙은 없다.
- `sitemap.xml` HTTP 200: 리뷰 상세 URL 74개. 앞선 점검의 73개와 다른 시점의 응답이다.
- `rss.xml` HTTP 200: 리뷰 30개. 최신 리뷰 81의 description은 정제한 HTML 2,486자여서, 이전 200자 발췌를 넘어선 전체 본문 제공 변경이 운영 피드에도 반영돼 있다.
- 리뷰 80 HTTP 200: title은 `자기만의 방·3기니 리뷰: 전쟁을 만드는 마음 | 북적`. 초기 HTML에 article과 Review JSON-LD가 있다. 검색 제목 보강 역시 운영 응답에서 확인했다.
- 리뷰 홈 HTTP 200: 초기 HTML의 서로 다른 개별 리뷰 링크 24개. 도서 `9788937461309` 상세 HTTP 200: 개별 리뷰 링크 0개.
- 현행 생성 성공 처리는 클라이언트 목록을 갱신하지만 서버 ISR 목록·피드 갱신이나 IndexNow 전송은 하지 않는다. 리뷰 목록과 RSS의 ISR, sitemap의 데이터 캐시는 6시간이다. 코드의 TTL을 실제 반영 지연 상한으로 해석하지 않는다.

다음 개발 우선순위는 **공개 리뷰 저장 커밋 후 IndexNow 자동 알림 → 발견용 피드 갱신 정책 → 도서 상세의 서버 리뷰 링크와 오래된 글 페이지네이션**이다. 변경 URL의 원문을 최신 상태로 제공한 뒤 알리고, 전송 실패 재시도·중복 제거·비공개 글 제외를 함께 설계한다. 공개였던 글의 삭제·비공개 전환도 기존 URL 변경을 알리는 대상으로 고려한다. IndexNow는 사이트맵/RSS가 갱신될 때까지 기다리지 않고 공개 원문 URL을 직접 알릴 수 있다. 전체 홈 캐시를 글마다 무효화할 필요는 없다.

네이버는 IndexNow를 공식 지원하지만 요청 수신 200은 색인 보장이 아니다. 개별 수집요청 역시 실시간 방문을 보장하지 않는다. 목표는 ‘등록 직후 변경 알림과 원문 제공’으로 잡고 실제 수집·색인·노출은 서치어드바이저에서 확인해야 한다. [IndexNow FAQ](https://searchadvisor.naver.com/guide/indexnow-faq), [수집요청 정책](https://searchadvisor.naver.com/guide/request-crawl)

독립 사이트 리뷰의 웹 검색 노출과 네이버 블로그·특정 도서 리뷰 영역 배치는 별개다. RSS나 IndexNow로 특정 영역 배치를 보장하는 방법은 확인하지 못했다. 공식 안내 재확인은 [조사 문서](review-search-official-guidance-2026-10-07.md)에 추가했다. 이번 재확인에서 서비스 코드·배포·검색엔진 제출은 변경하지 않았다.

## 결론

후속 구현(같은 날): 공개 리뷰 생성·수정·삭제의 커밋 후 변경 이벤트, id별 중복 제거·실패 재시도, ko/en 상세 서버 재검증, 최신 HTML/noindex/404 확인, 루트 소유 확인 키 파일, 네이버 IndexNow 전송을 추가했다. 처음부터 비공개인 글·조회수·리액션은 전송하지 않는다. 기본은 비활성이며 운영 설정과 웹/서버 배포가 필요하다. sitemap/RSS 캐시 주기·일반 생성 시 홈/목록 정책은 유지했다. 배포 순서와 메모리 큐의 재시작 한계는 [서버 리뷰 문서](../apps/server/src/features/review/README.md)에 기록했다. 실제 네이버 제출·배포는 이 구현 검증에 포함하지 않았다.

구현 검증: 서버 리뷰·도메인 이벤트 66건, 웹 웹훅·기존 재검증 16건 통과. 변경한 서버·웹 TypeScript 파일의 ESLint, 서버 `tsc --noEmit`, `git diff --check` 통과. 웹 전체 `tsc --noEmit`은 이번에 수정하지 않은 기존 테스트 6곳의 콜백 반환 타입 오류로 실패했다(`sitemap.test.ts`, `feedback-inbox.test.tsx` 2곳, `reading-log/__tests__/mutations.test.tsx`, `reading-height-view.test.tsx`, `reading-log-intro-view.test.tsx`). 전체 빌드·운영 DB 통합 검증은 실행하지 않았다.

공개 리뷰의 원문 전달과 기본 SEO 장치는 이미 있다. 개선할 부분은 **책을 식별하기 쉬운 제목, 오래된 글까지 이어지는 서버 HTML 링크, 신규·변경 URL 알림, RSS 본문**이다. 실제 색인율·검색 순위·유입의 병목은 Search Console과 네이버 서치어드바이저 계정 지표를 봐야 확정할 수 있다.

검색엔진에 URL을 알리는 일은 발견을 돕는 것이며 색인이나 상위 노출을 보장하지 않는다. 글을 다른 서비스에 복제 게시하는 작업과도 별개다. [Google 수집 요청 안내](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), [네이버 IndexNow FAQ](https://searchadvisor.naver.com/guide/indexnow-faq)

## 현재 확인한 상태

| 대상 | 실제 응답·코드 근거 | 판단 |
| --- | --- | --- |
| `https://bookjeok.com/robots.txt` | HTTP 200, 일반 크롤러 허용, sitemap 지정 | Googlebot·네이버 Yeti를 막는 규칙 없음 |
| `https://bookjeok.com/sitemap.xml` | HTTP 200, XML 정상 파싱. 전체 197 URL 중 리뷰 상세 73개, 최신 80부터 오래된 1까지 포함 | 과거의 리뷰 50건 한도는 현재 코드에서 해결됨. DB 전체와의 대조는 수행하지 않음 |
| `https://bookjeok.com/rss.xml` | HTTP 200, XML 정상 파싱. 전체 56 item 중 리뷰 30개 | 최신 리뷰 발견 창구 존재. 본문은 최대 200자 발췌 |
| `https://bookjeok.com/ko/book/reviews` | HTTP 200, `index, follow`, 자기 canonical. 초기 HTML의 숫자 리뷰 상세 링크 24개 | 기본 목록 링크 정상. sitemap의 다른 리뷰 49개는 이 홈 HTML에서 직접 연결되지 않음 |
| `https://bookjeok.com/ko/book/reviews/80` | Googlebot UA로 HTTP 200, h1·article·본문 전체·작성자·날짜·도서명·표지, canonical, Review/Breadcrumb JSON-LD | 원문 서버 렌더링 정상. title은 `전쟁을 만드는 마음 \| 북적` |
| `https://bookjeok.com/ko/book/reviews/78` | Yeti UA로 HTTP 200, 긴 원문 전체·h1·도서 정보·Review JSON-LD | JS 실행이나 로그인 없이 본문을 읽을 수 있음 |
| `https://bookjeok.com/ko/book/9788937461309/detail` | HTTP 200, ‘이 책의 독자 리뷰’ 제목 존재. 초기 HTML에 개별 리뷰 상세 링크 0개 | 관련 리뷰의 뷰포트 진입 후 조회에 의존 |
| `https://bookjeok.com/ko/book/reviews?isbn=9788937461309` | HTTP 200, canonical은 리뷰 홈. 초기 HTML의 리뷰 상세 24개가 기본 홈과 동일 | 도서별 서버 목록·독립 색인 페이지가 아님 |

크롤러 UA를 지정한 GET은 실제 Google·네이버의 IP나 WAF 통과를 검증하지 않는다. sitemap에 포함됐다는 사실도 색인됐다는 뜻은 아니다. 위 수치는 한 시점의 공개 응답이며 캐시가 반영한 시점이 서로 다를 수 있다.

## 개선 1: 검색 제목에 도서명 문맥을 보충

- 위치: `apps/web/src/app/[locale]/book/reviews/[id]/page.tsx:70`의 `const title = review.title`.
- 실측: 리뷰 80은 책이 『자기만의 방·3기니』인데 title에는 `전쟁을 만드는 마음 | 북적`만 있다. 책명·작가는 description과 본문에 있어 색인 차단 결함은 아니다.
- 제안: 작성자의 글 제목을 보존하고 검색 메타데이터에 책명을 보충한다. 예: `자기만의 방·3기니 리뷰: 전쟁을 만드는 마음 | 북적`. 원래 제목에 책명이 이미 있으면 중복을 피하고, 긴 도서 부제를 그대로 반복하지 않는다. 화면 h1을 강제로 바꿀 필요는 없다.
- 기대 효과: ‘책명 리뷰·독후감’ 검색에서 어떤 책에 대한 글인지 이해하기 쉽고, 검색 결과에서 클릭할 이유가 명확해진다. 특정 순위 상승량은 예측하지 않는다.

Google은 고유하고 간결하며 내용을 설명하는 제목을 권장하고, 실제 검색 제목은 title·h1·OG·링크 텍스트 등으로 자동 생성한다. [Google 제목 링크 안내](https://developers.google.com/search/docs/appearance/title-link)

## 개선 2: 도서 상세와 목록에서 오래된 리뷰까지 HTML 링크 연결

- 위치: `apps/web/src/features/review/components/review-detail/related-reviews/index.tsx`는 `useInView`로 활성화된 뒤 리뷰를 조회한다. 도서 상세 page는 리뷰 쿼리를 서버에서 시딩하지 않는다.
- 위치: `apps/web/src/features/review/components/review-detail/recommend-reviews/index.tsx` 역시 뷰포트 진입 후 조회한다. 실측한 리뷰 상세 80·78의 초기 HTML에는 다른 리뷰 상세 링크가 없었다. 실제 추천 결과가 있는지는 별도 API/브라우저 확인이 필요하다.
- 위치: `apps/web/src/features/review/components/review-list/review-grid-list/index.tsx`는 IntersectionObserver로 다음 페이지를 받으며, 고유 페이지 URL·다음 페이지 앵커가 없다.
- 제안: 우선 **리뷰가 있는 책의 상세에서 최근 공개 리뷰 4개를 서버 시딩**하고 링크를 내보낸다. 이전 리뷰까지 이어지는 작은 서버 목록/아카이브와 다음 페이지 링크를 마련하면 무한 스크롤 UI를 유지하면서 발견 경로를 늘릴 수 있다. 관련 글은 실제 결과가 있을 때 서버 링크로 제공한다.
- URL 정책: 기존 `?isbn=`·`?tag=`는 클라이언트 필터다. 이를 색인용 랜딩으로 바꿀 때는 서버 결과·고유 설명·canonical을 함께 설계한다. 서로 다른 아카이브 페이지를 모두 첫 페이지 canonical로 지정하지 않는다.
- 캐시 정책: 도서 상세는 현재 30일 ISR이다. 리뷰를 HTML에 넣으면 공개 리뷰 생성·수정·삭제·공개 여부 변경 시 **해당 책의 리뷰 목록 스냅샷도** 갱신할 필요가 생긴다. 서지 데이터 전체의 캐시 주기를 무조건 줄이지 않는다. 옵션으로 리뷰 아카이브를 별도 페이지로 분리할 수 있다.

Google은 실제 `<a href>` 링크를 권장하며 버튼 클릭이나 스크롤을 요구하는 콘텐츠는 크롤러가 발견하지 못할 수 있다. 네이버도 SPA의 주요 콘텐츠를 서버 렌더링하도록 권장한다. [Google 링크 안내](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), [Google 페이지네이션 안내](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading), [네이버 JavaScript SEO](https://searchadvisor.naver.com/guide/seo-advanced-javascript)

**홈에서 연결되지 않은 49개 리뷰가 미색인이라는 판단은 하지 않는다.** sitemap·다른 페이지·외부 링크로 이미 발견됐을 수 있다.

## 개선 3: 네이버 IndexNow + 발견용 데이터의 갱신 정책

현재 `apps/web/src/features/review/mutations/index.tsx`의 생성 성공 처리에는 서버 ISR 무효화가 없다. 목록·홈은 의도적으로 시간 기반에 맡기고 수정·삭제는 `shared/actions/revalidate.ts`로 상세를 걷어낸다. 이는 기존 비용 정책이다.

- 리뷰 홈: 6시간 ISR.
- sitemap: `apps/web/src/app/sitemap.ts`의 데이터 캐시 6시간 + `next.config.ts`의 CDN 캐시 6시간, 만료 뒤 stale-while-revalidate 24시간.
- RSS: `revalidate = 21600`, 별도 응답 캐시 설정도 존재.
- 생성 시 sitemap·RSS를 즉시 갱신하는 연결이나 IndexNow 구현은 확인되지 않았다.

따라서 새 글이 저장됐더라도 발견 창구의 기존 HTML/XML에는 바로 들어가지 않을 수 있다. **정확히 6시간 안에 반영된다거나, 이 지연 때문에 현재 검색이 안 된다고 단정할 수 없다.** 다층 캐시·재방문·재생성 시각에 영향을 받는다. 리뷰 80의 실제 상세 제목은 `전쟁을 만드는 마음`인데 같은 점검 시점의 RSS는 `전쟁 방지를 위한 추론`이었다. 수정 시각과 모든 중간 캐시를 추적하지 않았으므로 이 한 사례로 지연 상한을 산정하지 않는다.

제안:

1. 공개 리뷰의 생성·본문 수정·삭제·공개 여부 변경을 서버 커밋 이후의 신호로 연결한다. 브라우저가 후속 요청을 끝까지 실행해야만 알림이 전달되는 구조는 피한다.
2. 필요하면 리뷰 발견용 sitemap/RSS 캐시만 선택적으로 갱신하거나 변경을 묶어 갱신한다. 사이트맵 데이터 캐시와 CDN 응답 캐시는 별개이므로 실제 XML이 최신인지 확인한다. 모든 홈·집계 캐시를 매번 파기하지 않는다.
3. 공개 원문이 실제 최신 상태로 제공되는 것을 확인한 후 네이버 IndexNow에 정규 리뷰 URL을 보낸다. 새 글은 원문이 즉시 열리면 변경 URL 알림부터 제공할 수 있고, 사이트맵/RSS 갱신은 별도로 유지한다. 저장 요청과 외부 전송을 분리하고 실패 재시도·중복 제거를 둔다.
4. 루트의 소유 확인 키 `.txt` 파일은 현재 미들웨어 matcher의 정적 파일 제외 대상이다. 배포 후 인증·리다이렉트 없이 실제 200으로 제공되는지 검증한다. 새 환경 변수를 추가하면 `.env.example`·`turbo.json/globalEnv`에 함께 등록한다.
5. 비공개 신규 글은 제출하지 않는다. 이미 공개였던 글의 비공개 전환·삭제는 기존 URL의 변경을 알려 검색엔진이 noindex/404를 읽도록 한다. 비공개 원문을 제출하는 것은 아니다.

네이버는 IndexNow를 공식 지원하며 수신 200은 색인을 보장하지 않는다. Google은 공식 참여 목록에 없고, Google Indexing API는 채용 공고·일부 라이브 방송 용도라 리뷰에는 적용하지 않는다. [네이버 IndexNow FAQ](https://searchadvisor.naver.com/guide/indexnow-faq), [네이버 IndexNow 요청](https://searchadvisor.naver.com/guide/indexnow-request), [IndexNow 참여 엔진](https://www.indexnow.org/searchengines.json), [Google Indexing API 범위](https://developers.google.com/search/apis/indexing-api/v3/using-api)

## 개선 4: RSS에서 공개 리뷰 본문 전체 제공

- 위치: `apps/web/src/app/rss.xml/route.ts:20`의 최대 200자 발췌. 코드 주석의 검색 스니펫 길이 설명은 **RSS 본문 자체의 길이 제한 근거가 아니다**.
- 제안: 공개 리뷰의 정제한 전체 본문을 RSS item에 제공하고, CDATA 탈출 처리·공개 여부 필터·피드 용량 제한을 유지한다. 최신 30건 같은 제한을 없애고 모든 글을 넣을 필요는 없다. 전체 URL 발견은 sitemap이 담당한다.
- RSS의 한 공급처 조회 실패가 부분 피드 200으로 이어질 수 있으므로 개선 시 이전 정상 피드를 보존할지 함께 검토한다. 이번 실측에서 RSS 장애는 관측하지 않았다.

네이버의 RSS 제출 주의사항은 item의 본문 전체 공개를 요청하며, 피드는 10MB 미만이어야 한다. 현재 발췌 RSS가 무효이거나 미색인의 원인이라고 확정한 것은 아니다. [네이버 RSS·사이트맵 제출 안내](https://searchadvisor.naver.com/guide/request-feed)

## 유지할 부분과 낮은 우선순위

- **SSR 원문·공개 상세 자기 canonical·Review 구조화 데이터**는 이미 정상이다. `use client`만 보고 SSR이 없다고 판단하지 않는다.
- sitemap은 커서로 공개 글 전체를 순회한다. 다시 ‘50개만 담는다’고 지적하지 않는다.
- `Review.itemReviewed`의 `Book`은 Google Review snippet 지원 대상이다. 별점 척도 0.5~5도 실측 JSON-LD와 일치한다. 일반 검색 색인과 별표 스니펫 적격성은 별개다. [Google Review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
- `adjustCounter()`는 조회수·반응수 증가 시 `updatedAt`을 보존한다. sitemap lastmod·JSON-LD dateModified가 조회 때문에 밀리는 과거 문제는 현행 코드에서 방지한다.
- 작성자 공개 프로필 링크는 본문 HTML에 이미 있다. JSON-LD의 `author.url`·도서 `url`/`@id` 등을 보강하고 실제 Rich Results Test로 검사할 수 있으나 필수적인 신규 색인 장치는 아니다.
- 장문 글의 Article/BlogPosting은 선택 사항이다. 실제 글 성격에 맞을 때 추가하며 모든 리뷰에 강제하지 않는다. [Google Article 안내](https://developers.google.com/search/docs/appearance/structured-data/article)
- `priority`·`changefreq` 값만 올리는 것으로 Google 수집 우선순위를 높일 수 없다. meta keywords·태그 개수·글자 수 강제도 주된 개선으로 추천하지 않는다. [Google sitemap 안내](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Google 콘텐츠 안내](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- 태그 페이지는 기존 feature README에서 글 수 부족으로 보류했다. 현재 태그 사용량을 실측하지 않았으므로 일괄 페이지 생성은 추천하지 않는다.
- AI 검색 봇 차단은 별도 비용 정책이다. Googlebot/Yeti 노출을 개선하기 위해 이 목록 전체를 해제할 필요는 없다. AI 검색 확산은 별도 목표로 검토한다.

## 실제 성과 확인과 실행 순서

Search Console·서치어드바이저 검증용 meta 태그는 코드에 있다. 하지만 소유권 인증 완료·사이트맵/RSS 제출 완료·실제 색인·노출·클릭은 이 태그만으로 확인할 수 없다. 로그인된 운영 도구에 접근하지 않았으며, 제한적인 외부 검색 결과만으로 리뷰의 색인 여부를 판정하지 않았다. [Google site: 연산자 한계](https://developers.google.com/search/docs/monitor-debug/search-operators/all-search-site)

1. 운영 도구에서 최신/오래된 리뷰 5~10개의 마지막 수집·색인·선택 canonical을 확인하고 sitemap/RSS 제출 상태를 본다. 그 결과로 ‘발견 실패’와 ‘읽었지만 색인 제외’를 구분한다.
2. 작은 변경인 검색 제목 보강과 RSS 본문 전체 제공을 먼저 처리한다.
3. 도서 상세→리뷰 서버 링크·오래된 리뷰 아카이브를 추가하고 해당 범위의 캐시 갱신을 맞춘다.
4. 네이버 IndexNow를 생성·변경 이벤트에 붙이고 발행→알림→첫 수집 시간을 기록한다.
5. 리뷰 경로 `/ko/book/reviews/`에 대한 색인 수, 책명 관련 검색 노출·클릭을 변경 전후 비교한다. 별표 결과는 Rich Results Test로 따로 검증한다. 단순 제출 성공 건수만으로 SEO 효과를 평가하지 않는다.

이번 작업에서 서비스 코드·테스트·운영 상태를 바꾸지 않아 빌드나 테스트는 실행하지 않았다. 공개 GET은 글 읽기용이며 댓글·리액션·조회수 POST·검색 제출·대량 크롤링은 수행하지 않았다. 원시 응답은 로컬 `/tmp/bookjeok-seo-*`에 임시 보관했다.

공식 근거의 상세 조사: [review-search-official-guidance-2026-10-07.md](review-search-official-guidance-2026-10-07.md).
