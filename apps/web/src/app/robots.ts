import { MetadataRoute } from "next";

/**
 * 검색 유입이 없으면서 카탈로그 전체를 훑는 크롤러.
 *
 * 도서 상세는 경로 수가 카탈로그 크기(5만+)라 한 번의 전수 크롤이 그대로
 * ISR 쓰기와 Fluid 실행 시간으로 청구된다. robots.txt는 강제가 아니지만
 * 이 목록의 다수는 준수한다.
 */
const ZERO_VALUE_CRAWLERS = [
  // AI 학습·수집
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "Bytespider",
  "Amazonbot",
  "cohere-ai",
  "Diffbot",
  "ImagesiftBot",
  "Omgilibot",
  "YouBot",
  "Timpibot",
  // SEO 분석 도구
  "AhrefsBot",
  "SemrushBot",
  "DataForSeoBot",
  "MJ12bot",
  "DotBot",
  "BLEXBot",
  "PetalBot",
  "Barkrowler",
  "ZoominfoBot",
  "serpstatbot",
  "SeekportBot",
];

export default function robots(): MetadataRoute.Robots {
  // Preview 환경(test.bookjeok.com 등)에서만 크롤러 차단
  if (process.env.VERCEL_ENV === "preview") {
    return {
      rules: [{ userAgent: "*", disallow: ["/"] }],
    };
  }

  return {
    rules: [
      {
        userAgent: ZERO_VALUE_CRAWLERS,
        disallow: ["/"],
      },
      // 일반 크롤러 허용 (Googlebot, Naver 등 포함)
      //
      // /en은 막지 않는다. 수집을 끊으면 크롤러가 레이아웃의 noindex를 읽지 못해
      // 이미 색인된 /en 페이지가 그대로 남는다. 색인이 빠진 뒤 Disallow로 전환할 것.
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/*/my-page", "/*/login", "/*/signup", "/*/callback"],
      },
    ],
    sitemap: "https://bookjeok.com/sitemap.xml",
  };
}
