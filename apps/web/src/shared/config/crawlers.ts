/**
 * 크롤러 UA 분류. robots.txt(부탁)와 미들웨어(강제)가 같은 목록을 쓴다.
 * 두 벌로 나누면 한쪽이 낡는다.
 */

/** 검색 유입을 만드는 크롤러. 차단 검사보다 먼저 통과시킨다. */
const SEARCH_CRAWLERS = [
  "Googlebot",
  "Google-InspectionTool",
  "Storebot-Google",
  "AdsBot-Google",
  "Bingbot",
  "Yeti", // 네이버
  "Daumoa", // 다음
  "DuckDuckBot",
];

/** SNS 공유 카드 수집기. 링크 미리보기가 깨지므로 막지 않는다. */
export const SNS_SCRAPERS = [
  "facebookexternalhit",
  "twitterbot",
  "slackbot",
  "discordbot",
  "linespider",
  "telegrambot",
  "kakaotalk-scrap",
  "kakaotalk",
  "daum",
  "whatsapp",
];

/**
 * 검색 유입 없이 카탈로그를 훑는 크롤러.
 *
 * 도서 상세는 경로 수가 카탈로그 크기(5만+)라 한 번의 전수 크롤이 그대로
 * ISR 단위와 Fluid 실행 시간으로 청구된다.
 */
export const ZERO_VALUE_CRAWLERS = [
  // AI 학습·수집
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "CCBot",
  "Google-Extended", // Gemini 학습용. 검색 순위와 무관
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
  // 실측(2026-09-12~13 activity_logs)에서 상위를 차지한 비검색 크롤러
  "Applebot", // Siri·Spotlight용. 국내 유입 없음
  "Mediapartners-Google", // AdSense 전용. 검색 색인과 무관
  "Baiduspider", // 중국 검색. CN 트래픽은 이미 403
  "GoogleOther", // 색인용이 아닌 범용 수집
];

const toPattern = (tokens: string[]) =>
  new RegExp(
    tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&")).join("|"),
    "i",
  );

// 미들웨어는 모든 요청에서 돈다. 정규식은 모듈 로드 때 한 번만 만든다.
const ALLOWED_PATTERN = toPattern([...SEARCH_CRAWLERS, ...SNS_SCRAPERS]);
const BLOCKED_PATTERN = toPattern(ZERO_VALUE_CRAWLERS);
const SNS_PATTERN = toPattern(SNS_SCRAPERS);

/** SNS 스크래퍼인지. 로케일 없는 경로를 리다이렉트 대신 rewrite로 준다. */
export const isSnsScraper = (userAgent: string) => SNS_PATTERN.test(userAgent);

/**
 * 엣지에서 끊을 크롤러인지. 허용 목록이 항상 이긴다.
 * `bot` 같은 느슨한 패턴이 Googlebot을 삼키는 사고를 막는 장치다.
 */
export const isBlockedCrawler = (userAgent: string) => {
  if (!userAgent) return false;
  if (ALLOWED_PATTERN.test(userAgent)) return false;
  return BLOCKED_PATTERN.test(userAgent);
};
