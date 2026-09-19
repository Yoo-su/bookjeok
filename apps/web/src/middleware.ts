import { isValidIsbn } from "@bookjeok/core";
import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { isBlockedCrawler, isSnsScraper } from "./shared/config/crawlers";
import { routing } from "./shared/config/i18n/routing";
import { isKnownLocaleSegment } from "./shared/config/route-segments";

/** 확장자가 없는데 점이 있는 경로. 스캐너가 던지는 `/index.php`, `/.env` 류다. */
const looksLikeFile = (segment: string | undefined) =>
  Boolean(segment && segment.includes("."));

/** `/{locale}/book/{isbn}/detail` 경로의 ISBN이 형식에 맞는지 확인한다. 다른 경로는 항상 통과. */
function isRenderableBookDetail(segments: string[]): boolean {
  const isBookDetail =
    segments.length === 3 && segments[0] === "book" && segments[2] === "detail";

  return !isBookDetail || isValidIsbn(segments[1]);
}

const intlMiddleware = createMiddleware(routing);

const EXCLUDE_PATHS = [
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
  "/rss.xml",
  "/ads.txt",
];

export default function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const country = request.headers.get("x-vercel-ip-country") || "";

  // 1. 중국 지역 트래픽 차단
  if (country === "CN") {
    return new NextResponse(null, { status: 403 });
  }

  // 2. 검색 유입 없는 크롤러 차단
  //
  // robots.txt는 부탁이라 무시하는 쪽이 비용을 만든다. 미들웨어는 ISR 캐시 조회와
  // 렌더보다 먼저 돌아, 여기서 끊으면 ISR 단위도 Fluid 실행 시간도 발생하지 않는다.
  if (isBlockedCrawler(userAgent)) {
    return new NextResponse(null, { status: 403 });
  }

  const { pathname } = request.nextUrl;
  const isExcluded = EXCLUDE_PATHS.includes(pathname);
  const segments = pathname.split("/").filter(Boolean);
  const hasLocale = routing.locales.includes(segments[0] as never);
  const withoutLocale = hasLocale ? segments.slice(1) : segments;

  // 3. 로케일이 없으면서 파일처럼 생긴 경로는 렌더 없이 404
  //
  // 미들웨어가 못 보면 `[locale]`이 `.env` 같은 문자열을 로케일 파라미터로 받아
  // 249KB짜리 not-found를 렌더하고 그것을 ISR 엔트리로 남긴다. 경로 공간이 무한하다.
  if (!hasLocale && !isExcluded && looksLikeFile(segments[0])) {
    return new NextResponse(null, { status: 404 });
  }

  // 4. 첫 세그먼트가 실제 라우트가 아니면 렌더 없이 404
  //
  // `[...not_found]`는 동적이라 캐시에 남지 않고, 매 요청 133KB 셸을 다시 그린다.
  // 로케일이 없는 경우에도 먼저 본다. 아래 301을 태우면 `/admin` 하나가
  // 리다이렉트 + 404 렌더로 두 번 청구된다.
  if (!isExcluded && !isKnownLocaleSegment(withoutLocale[0])) {
    return new NextResponse(null, { status: 404 });
  }

  // 5. 형식이 틀린 ISBN은 렌더 없이 404
  //
  // 도서 상세는 dynamicParams가 열려 있어 임의 문자열이 그대로 ISR 엔트리가 된다.
  // 내부 링크는 전부 DB의 ISBN이라 사람이 여기 걸릴 일은 사실상 없다.
  if (!isRenderableBookDetail(withoutLocale)) {
    return new NextResponse(null, { status: 404 });
  }

  // 숫자 상세 경로의 표기를 하나로 고정해 동일 콘텐츠의 ISR 엔트리가 늘지 않게 한다.
  if (
    withoutLocale.length === 3 &&
    withoutLocale[0] === "book" &&
    ["reviews", "sales"].includes(withoutLocale[1]) &&
    !["write", "register"].includes(withoutLocale[2])
  ) {
    const id = withoutLocale[2];
    if (
      !/^\d+$/.test(id) ||
      !Number.isSafeInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return new NextResponse(null, { status: 404 });
    }
    const normalizedId = String(Number(id));
    if (id !== normalizedId) {
      const url = request.nextUrl.clone();
      const locale = hasLocale ? segments[0] : routing.defaultLocale;
      url.pathname = `/${locale}/book/${withoutLocale[1]}/${normalizedId}`;
      return NextResponse.redirect(url, 308);
    }
  }

  // SNS 공유 시 리다이렉션 지연 및 수집 실패를 예방하기 위해, 스크래퍼 봇은 내부 rewrite 처리(200 OK 즉시 서빙)합니다.
  const isSnsBot = isSnsScraper(userAgent);

  if (isSnsBot && !hasLocale && !isExcluded) {
    const defaultLocale = routing.defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;

    // Rewrite시 next-intl/server 동작을 위해 필요한 로케일 헤더를 강제 주입
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-next-intl-locale", defaultLocale);

    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 일반 사용자는 다국어 접두사(/ko, /en)가 없고 예외 파일이 아니면 301 영구 리다이렉션 (SEO 이점)
  if (!isSnsBot && !hasLocale && !isExcluded) {
    const defaultLocale = routing.defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url, 301);
  }

  // 이미 로케일이 있는 요청(봇 포함)이거나, 그 외의 경우에는 next-intl 미들웨어를 정상적으로 실행
  return intlMiddleware(request);
}

export const config = {
  /**
   * 정적 자산과 내부 경로만 제외한다.
   *
   * 이전에는 `.*\..*`로 "점이 있으면 무조건 제외"였고, 그래서 `/index.php` 같은
   * 스캐너 경로가 미들웨어를 건너뛰고 `[locale]`까지 들어갔다.
   *
   * 확장자 목록은 **실제로 서빙하는 것만** 적는다. 방어적으로 넓히면 그만큼
   * 구멍이 다시 열린다 (`.json`을 넣었더니 `/config.json`이 25KB를 렌더했다).
   * `public/`에 새 확장자를 추가하면 여기도 함께 늘려야 한다.
   */
  matcher: [
    "/((?!api|_next|_vercel|\\.well-known|.*\\.(?:ico|png|jpg|jpeg|svg|txt|xml|webmanifest|mp4|woff2)$).*)",
  ],
};
