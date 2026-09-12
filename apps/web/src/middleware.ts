import { isValidIsbn } from "@bookjeok/core";
import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./shared/config/i18n/routing";

// 차단할 봇 User-Agent 패턴 목록
const BLOCKED_BOT_PATTERNS = [/GoogleOther/i, /Google-Extended/i];

/** `/{locale}/book/{isbn}/detail` 경로의 ISBN이 형식에 맞는지 확인한다. 다른 경로는 항상 통과. */
function isRenderableBookDetail(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const withoutLocale = routing.locales.includes(segments[0] as never)
    ? segments.slice(1)
    : segments;

  const isBookDetail =
    withoutLocale.length === 3 &&
    withoutLocale[0] === "book" &&
    withoutLocale[2] === "detail";

  return !isBookDetail || isValidIsbn(withoutLocale[1]);
}

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const country = request.headers.get("x-vercel-ip-country") || "";

  // 1. 중국 지역 트래픽 차단
  if (country === "CN") {
    return new NextResponse(null, { status: 403 });
  }

  // 2. 차단 대상 봇인지 확인 (User-Agent 기반)
  /* const isBlockedBot = BLOCKED_BOT_PATTERNS.some((pattern) =>
    pattern.test(userAgent),
  );

  if (isBlockedBot) {
    return new NextResponse("Too Many Requests", { status: 429 });
  } */

  const { pathname } = request.nextUrl;

  // 3. 형식이 틀린 ISBN은 렌더 전에 끊는다
  //
  // 도서 상세는 dynamicParams가 열려 있어 임의 문자열이 그대로 ISR 엔트리가 된다.
  // 내부 링크는 전부 DB의 ISBN이라 사람이 여기 걸릴 일은 사실상 없다.
  if (!isRenderableBookDetail(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  const isSnsBot = [
    /facebookexternalhit/i,
    /twitterbot/i,
    /slackbot/i,
    /discordbot/i,
    /linespider/i,
    /telegrambot/i,
    /kakaotalk-scrap/i,
    /daum/i,
    /kakaotalk/i,
    /whatsapp/i,
  ].some((pattern) => pattern.test(userAgent));

  const hasLocale = routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  const EXCLUDE_PATHS = [
    "/robots.txt",
    "/sitemap.xml",
    "/favicon.ico",
    "/rss.xml",
  ];
  const isExcluded = EXCLUDE_PATHS.includes(pathname);

  // SNS 공유 시 리다이렉션 지연 및 수집 실패를 예방하기 위해, 스크래퍼 봇은 내부 rewrite 처리(200 OK 즉시 서빙)합니다.
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
  // 모든 경로에 대해 미들웨어를 실행하되, api, _next, _vercel, 정적 파일은 제외합니다.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
