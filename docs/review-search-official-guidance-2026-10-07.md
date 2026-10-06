# 도서 리뷰 검색 노출: 공식 가이드 조사

확인일: 2026-10-07 (한국 시간). Google Search Central, 네이버 Search Advisor, IndexNow 공식 문서만 사용했다. 이 문서는 검색엔진의 안내를 정리하며, 북적의 현재 구현·운영 계정·실제 색인 여부는 별도 코드 및 운영 점검으로 확인해야 한다.

## 판단 기준

검색엔진에 URL을 알리는 것, 본문을 수집하는 것, 색인하는 것, 특정 검색어에 노출하는 것, 상위에 표시하는 것은 서로 다르다. Google과 네이버 모두 수집 요청으로 검색 반영을 보장하지 않는다. Google은 수집에 며칠에서 몇 주가 걸릴 수 있다고 안내하고, 네이버의 개별 수집 요청도 우선순위에 따라 최소 하루에서 몇 주가 걸릴 수 있다. 따라서 개선 목표는 공개 리뷰를 빠짐없이 발견하고 읽을 수 있게 하는 것과 실제 검색 성과를 측정하는 것이다. [Google 재수집 요청](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), [네이버 수집요청 정책](https://searchadvisor.naver.com/guide/request-crawl)

## 1. 원문을 HTML로 전달하고 내부 링크를 열어 두기

Google은 JavaScript를 렌더링하지만 실행 전 실제 본문이 없는 페이지는 렌더링에 의존한다. 서버 렌더링·사전 렌더링은 사용자와 크롤러에 유리하다고 권장한다. 네이버도 SPA 수집·색인을 지원하지만 처리 비용이 크므로 주요 HTML 영역을 서버에서 렌더링하라고 권장한다. “네이버는 JavaScript를 전혀 못 읽는다”는 설명은 정확하지 않다. [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [네이버 JavaScript SEO](https://searchadvisor.naver.com/guide/seo-advanced-javascript)

북적 적용 제안: 로그인하지 않은 일반 요청의 HTML에 리뷰 제목·전체 본문·작성자·작성일·도서명이 들어 있는지 확인한다. Next.js의 서버 렌더링 여부뿐 아니라 응답 HTML에 실제 텍스트가 있는지 확인해야 한다. 필요한 CSS/JS 리소스를 robots.txt가 막지 않는지도 점검한다. 이는 위 가이드에 따른 구현 점검 제안이며, SSR만으로 색인이 보장된다는 뜻은 아니다.

리뷰 카드와 이전·다음 목록은 실제 `<a href="...">` 링크를 제공해야 한다. 클릭 이벤트만 있는 카드로는 네이버가 대상 URL을 정확히 알기 어렵다. Google 크롤러도 일반적으로 버튼을 클릭하거나 사용자 동작을 요구하는 함수를 실행하지 않는다. [네이버 검색 친화적인 URL·링크](https://searchadvisor.naver.com/guide/seo-advanced-url), [Google 페이지 분할·무한 스크롤](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)

북적 적용 제안: 리뷰 허브·도서 상세·작성자 공개 프로필에서 각 리뷰 원문으로 연결한다. 무한 스크롤을 사용해도 오래된 리뷰를 발견할 수 있는 서버 렌더링 목록과 다음 페이지 링크를 둔다. 페이지마다 고유 URL을 사용하고, 실제로 다른 내용을 가진 페이지들을 전부 첫 페이지 canonical로 합치지 않는다. Google은 페이지 분할 시 페이지별 canonical을 권장한다. 해시(`#page=2`)는 독립 페이지 번호로 쓰지 않는다. `rel=next/prev` 메타 태그만 추가해 해결하려 하지 않는다. Google은 이를 더 이상 사용하지 않는다. [Google 페이지 분할 가이드](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)

## 2. 사이트맵의 목록과 수정일을 정확히 유지하기

Google은 사이트맵의 `priority`와 `changefreq`를 무시한다. `lastmod`는 지속적으로 정확하고 검증 가능할 때 활용하며, 본문·구조화 데이터·링크 등 중요한 변경 시간을 반영해야 한다. 사이트맵을 만들 때마다 현재 시간을 찍거나 조회수만 올라가도 글 수정일을 바꾸는 방식은 피한다. [Google 사이트맵 작성·제출](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

네이버는 사이트맵에 수집 대상 URL을 담고, 내부 알고리즘으로 수집 우선순위를 선정한다. 사이트맵·RSS를 콘텐츠 피드로 보아 주기적으로 재방문한다. [네이버 RSS 및 사이트맵 제출](https://searchadvisor.naver.com/guide/request-feed)

북적 적용 제안: 신규 공개 리뷰가 캐시 재검증 뒤 사이트맵에 나타나는지, 수정한 글의 `lastmod`가 실제 본문 수정 시각인지, 삭제·비공개 글이 빠지는지 확인한다. 한정된 최신 목록만 사이트맵에 포함한다면 오래된 공개 글도 포함하는 구조를 검토한다. 사이트맵 갱신과 HTML 캐시 갱신이 모두 끝난 뒤 알림을 보내는 것이 일관된 상태를 제공하는 설계다. 이 순서는 구현 제안이다.

## 3. 네이버 IndexNow로 생성·변경·삭제 URL 알리기

네이버는 공개 IndexNow 엔드포인트를 제공한다. 사이트에 소유를 증명하는 키 파일을 공개하고 GET으로 한 URL, POST로 한 번에 최대 10,000 URL을 전송할 수 있다. 키 파일은 사이트 루트에 두는 방식이 권장된다. 별도 디렉터리에 두면 알림 대상 범위에 제약이 있다. [네이버 IndexNow 키 생성](https://searchadvisor.naver.com/guide/indexnow-api-key), [네이버 페이지 갱신 요청](https://searchadvisor.naver.com/guide/indexnow-request)

응답 200은 알림 수신을 의미하고 색인을 보장하지 않는다. 404·301·302로 바뀐 URL도 알릴 수 있다. IndexNow는 사이트맵·RSS·서치어드바이저 수집 요청을 대체하지 않는다. 네이버 FAQ는 도입 이전 변경 URL의 소급 제출을 권장하지 않는다. [네이버 IndexNow FAQ](https://searchadvisor.naver.com/guide/indexnow-faq)

북적 적용 제안: 도입 이후 공개 리뷰 생성·본문 수정·삭제 시 원문 URL을 알리고, 실패 재시도와 중복 제거를 둔다. 리뷰 저장 자체가 외부 알림 실패 때문에 실패하지 않도록 비동기 작업으로 분리한다. 비공개 내용은 전송하지 않는다. 원문 HTML이 최신 상태로 제공되는지 확인하고, 목록·사이트맵 갱신은 별도로 유지한다. 생성된 원문이 즉시 열리면 목록 캐시 만료를 기다리지 않고 알림을 보낼 수 있다. 이 내용은 가이드에서 도출한 설계 제안이며 구현 여부는 별도 확인이 필요하다.

2026-10-07에 확인한 공식 참여 엔진 목록에는 네이버·Bing 등이 있으며 Google은 없다. 따라서 Google에도 동시에 알림이 전달된다고 설명하면 안 된다. [IndexNow 공식 참여 엔진 목록](https://www.indexnow.org/searchengines.json)

주의: 네이버의 기존 “수집요청 API”는 제휴 신청·사이트 소유 확인·제휴 인증을 요구하는 별도 경로다. 이를 공개 IndexNow와 혼동하지 않는다. [네이버 수집요청 API 명세](https://searchadvisor.naver.com/guide/crawl-request-api)

## 4. Google 알림은 사이트맵과 Search Console로

많은 URL은 사이트맵으로 알리고, 개별 중요한 URL은 Search Console URL 검사에서 색인 요청을 할 수 있다. 같은 URL을 반복 요청해도 더 빨리 수집되지 않는다. [Google 재수집 요청](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)

Google Indexing API는 `JobPosting` 또는 `VideoObject`에 포함된 `BroadcastEvent` 페이지에만 쓸 수 있다. 일반 도서 리뷰를 제출하는 용도로 도입하지 않는다. [Google Indexing API 사용 범위](https://developers.google.com/search/apis/indexing-api/v3/using-api)

## 5. Review, Book, Article 구조화 데이터의 역할

Google의 Review snippet 지원 대상에는 `Book`이 명시되어 있다. 도서 리뷰 상세는 `Review.itemReviewed`로 특정 `Book`을 가리키거나 `Book.review`로 리뷰를 중첩할 수 있다. 작성자와 도서명을 정확히 제공하고, 실제 별점이 있을 때 실제 척도에 맞는 `reviewRating`을 사용한다. 작성자·작성일이 있는 개별 리뷰는 평점을 생략할 수 있다는 예제 안내도 있으나, 같은 문서의 필수 속성 표는 `reviewRating`·`ratingValue`를 나열한다. 무평점 리뷰의 구체적인 리치 결과 적격성은 Rich Results Test로 확인하고 별표 노출을 약속하지 않는다. 별점을 쓰지 않는 서비스를 리치 결과 때문에 바꾸거나 가짜 별점을 넣을 필요는 없다. 일반 검색 색인은 별표 스니펫과 별개다. [Google Review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)

여러 리뷰 평균은 `AggregateRating`으로 표현한다. 특정 책에 대한 실제 자사 리뷰만 사용하고, 페이지에서 리뷰·해당 평점·평균을 독자가 확인할 수 있어야 한다. 타 사이트의 리뷰를 합산하거나 실제 없는 평점을 만들어 넣지 않는다. [Google Review snippet 정책](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)

별도 Google “Book actions” 기능은 도서 읽기·구매·대여 액션을 위한 기능이다. 도서 리뷰를 검색에 올리기 위해 그 기능까지 구현해야 하는 것은 아니다. [Google Book actions](https://developers.google.com/search/docs/appearance/structured-data/book)

장문의 독서 후기처럼 글이 중심인 페이지는 `Article` 또는 `BlogPosting`도 검토할 수 있다. Google은 기사·블로그 글의 제목·이미지·날짜 등을 이해하는 데 도움을 준다고 설명한다. `author.name`, 작성자를 식별하는 `author.url`, `headline`, `datePublished`, 실제 `dateModified`, 적절한 `image`를 제공하는 것이 권장된다. 현재 Article 가이드는 필수 속성을 지정하지 않고 콘텐츠에 맞는 권장 속성을 넣으라고 안내한다. [Google Article 구조화 데이터](https://developers.google.com/search/docs/appearance/structured-data/article)

북적 적용 판단: 우선 실제 도서 리뷰에 맞는 `Review`를 유지·검증한다. 모든 짧은 평까지 `BlogPosting`으로 덮어씌우는 것은 공식 요구가 아니다. 본문 중심의 독립 글에서 추가 Article 표현이 유용한지 선택한다. 구조화 데이터는 화면의 실제 내용과 일치해야 하며, 테스트를 통과해도 리치 결과는 보장되지 않는다. [Google 구조화 데이터 일반 정책](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)

## 6. 제목·본문·작성자 정보로 글을 구별하기

Google은 간결하고 설명적이며 고유한 제목과 명확한 주요 제목을 권장한다. 검색 결과 제목은 `<title>`, 화면 제목, `h1`, `og:title`, 링크 텍스트 등을 바탕으로 자동 생성된다. 북적 적용 제안은 `리뷰 제목 — 도서명 독서 리뷰 | 북적`처럼 글 내용과 책을 함께 식별하는 제목이다. 작성자가 정한 제목의 의미를 보존하면서 페이지별 구별 정보를 보충한다. 검색어를 반복하는 제목은 피한다. [Google 제목 링크](https://developers.google.com/search/docs/appearance/title-link), [네이버 SEO 기본 가이드](https://searchadvisor.naver.com/guide/seo-help)

설명은 리뷰별 실제 본문에서 HTML을 제거한 읽기 좋은 요약으로 제공한다. Google은 주로 본문에서 검색어에 맞는 스니펫을 만들고 때로 meta description을 사용한다. 설정한 설명이 그대로 노출되는 것은 아니다. [Google 스니펫·설명](https://developers.google.com/search/docs/appearance/snippet)

작성자의 독서 경험·구체적인 해석·다른 리뷰와 구별되는 내용이 독자에게 도움이 된다. Google은 선호하는 글자 수가 없다고 명시하므로 “몇 자 이상이면 검색 순위가 오른다”는 규칙을 만들지 않는다. 검색을 위한 자동 요약 양산보다 독자가 직접 쓴 글과 작성자 정보를 충실하게 보여 주는 것이 적합하다. [Google 사람 중심 콘텐츠](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

## 7. RSS와 UGC 품질 관리는 보완 수단

네이버는 최신 콘텐츠 RSS에 본문 전체를 제공하라고 안내한다. 사이트맵보다 많은 URL을 담기 어려워 사이트맵을 적극 활용하라고도 권장한다. Google은 RSS 2.0·Atom 1.0을 사이트맵으로 받을 수 있지만 최신 URL만 제공된다는 한계가 있다. 북적에 최신 공개 리뷰 피드를 추가하는 것은 보완책이며 전체 사이트맵·내부 링크의 대체가 아니다. [네이버 RSS](https://searchadvisor.naver.com/guide/request-feed), [Google 피드 사이트맵](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

공개 사용자 글은 광고 링크·도배·복제 콘텐츠의 입력 통로가 될 수 있다. Google은 UGC 스팸을 금지하며 의심 글의 검토와 신뢰하지 않는 링크의 `rel="ugc"` 또는 `nofollow`를 제안한다. 정상 공개 리뷰를 일괄 `noindex`로 바꾸는 것은 검색 확산 목표와 맞지 않는다. 신고·검토·의심 콘텐츠 제외 같은 실제 문제에 대한 통제를 우선 검토한다. [Google UGC 스팸 정책](https://developers.google.com/search/docs/essentials/spam-policies#user-generated-spam), [Google 사용자 스팸 방지](https://developers.google.com/search/docs/monitor-debug/prevent-abuse), [Google 외부 링크 표시](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links)

## 운영 확인 순서

1. 새 리뷰·수정 리뷰·오래된 리뷰·삭제 리뷰 표본으로 비로그인 HTTP 응답과 본문 HTML, robots, canonical, JSON-LD를 확인한다. 이는 위 기술 가이드에 따른 점검 제안이다.
2. Google Search Console에서 URL 검사·페이지 색인 상태·실적을 보고 실제로 수집·색인되는지 확인한다. `site:` 검색 결과 목록은 완전하지 않아 미노출만으로 미색인을 단정하지 않는다. [Google 재수집·상태 확인](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), [Google site: 연산자 한계](https://developers.google.com/search/docs/monitor-debug/search-operators/all-search-site)
3. 네이버 서치어드바이저에서 사이트맵/RSS 제출 상태, 수집·색인 오류와 노출·클릭을 확인한다. 수집 성공과 검색 노출은 별도로 측정한다. [네이버 수집 현황](https://searchadvisor.naver.com/guide/report-crawl-refine), [네이버 노출 및 클릭](https://searchadvisor.naver.com/guide/report-expose-ctr)
4. 변경 전후 공개 리뷰 수 대비 사이트맵 포함 수, 발행부터 첫 수집까지의 시간, 리뷰 URL 검색 노출·클릭을 기록한다. 이는 개선 효과를 판단하기 위한 운영 지표 제안이며 공식 보장 기간·목표치는 아니다.

우선순위 제안: 실제 본문·링크·canonical 결함 → 전체 공개 URL 발견 및 정확한 수정일 → 네이버 IndexNow → 제목·구조화 데이터 개선 → RSS. 실제 북적 구현 점검 결과에 따라 순서를 조정한다.
