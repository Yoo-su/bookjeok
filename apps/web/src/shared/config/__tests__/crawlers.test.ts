import { describe, expect, it } from "vitest";

import { isBlockedCrawler, isSnsScraper } from "../crawlers";

// 2026-09-12~13 activity_logs에서 실제로 관측된 UA
const GOOGLEBOT =
  "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.36 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const YETI =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko; compatible; Yeti/1.1; +https://naver.me/spd) Chrome/149.0.0.0 Safari/537.36";
const APPLEBOT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)";
const MEDIAPARTNERS = "Mediapartners-Google";
const BAIDU =
  "Mozilla/5.0 (compatible; Baiduspider-render/2.0; +http://www.baidu.com/search/spider.html)";
const HUMAN_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";

describe("isBlockedCrawler", () => {
  it("검색 유입을 만드는 크롤러는 통과시킨다", () => {
    expect(isBlockedCrawler(GOOGLEBOT)).toBe(false);
    expect(isBlockedCrawler(YETI)).toBe(false);
    expect(isBlockedCrawler("Mozilla/5.0 (compatible; bingbot/2.0)")).toBe(
      false,
    );
  });

  it("일반 브라우저는 통과시킨다", () => {
    expect(isBlockedCrawler(HUMAN_CHROME)).toBe(false);
  });

  it("UA가 비어 있으면 통과시킨다", () => {
    expect(isBlockedCrawler("")).toBe(false);
  });

  it("실측 상위 비검색 크롤러를 막는다", () => {
    expect(isBlockedCrawler(APPLEBOT)).toBe(true);
    expect(isBlockedCrawler(MEDIAPARTNERS)).toBe(true);
    expect(isBlockedCrawler(BAIDU)).toBe(true);
  });

  it("AI 학습·SEO 도구 크롤러를 막는다", () => {
    expect(isBlockedCrawler("GPTBot/1.0")).toBe(true);
    expect(isBlockedCrawler("Mozilla/5.0 (compatible; ClaudeBot/1.0)")).toBe(
      true,
    );
    expect(isBlockedCrawler("Mozilla/5.0 (compatible; AhrefsBot/7.0)")).toBe(
      true,
    );
  });

  // 허용 목록이 먼저 걸리지 않으면 Googlebot이 차단 패턴에 삼켜진다.
  // 그 사고는 색인 전체를 날린다.
  it("Google 계열 중 검색 크롤러만 통과하고 나머지는 막힌다", () => {
    expect(isBlockedCrawler(GOOGLEBOT)).toBe(false);
    expect(isBlockedCrawler("Google-Extended")).toBe(true);
    expect(isBlockedCrawler("GoogleOther")).toBe(true);
    expect(isBlockedCrawler(MEDIAPARTNERS)).toBe(true);
  });
});

describe("isSnsScraper", () => {
  it("공유 카드 수집기를 알아본다", () => {
    expect(isSnsScraper("facebookexternalhit/1.1")).toBe(true);
    expect(isSnsScraper("Twitterbot/1.0")).toBe(true);
    expect(isSnsScraper("kakaotalk-scrap/1.0")).toBe(true);
  });

  it("SNS 스크래퍼는 차단 대상이 아니다", () => {
    expect(isBlockedCrawler("facebookexternalhit/1.1")).toBe(false);
  });

  it("일반 브라우저는 아니다", () => {
    expect(isSnsScraper(HUMAN_CHROME)).toBe(false);
  });
});
