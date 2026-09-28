import { formatPostDate, getSimpleDate } from "@bookjeok/core";
import { describe, expect, it } from "vitest";

describe("getSimpleDate (yyyymmdd 변환)", () => {
  it("날짜를 yyyymmdd 형식으로 반환한다", () => {
    const date = new Date(2025, 0, 15); // 2025년 1월 15일
    expect(getSimpleDate(date)).toBe("20250115");
  });

  it("월/일이 한 자리수일 때 0으로 패딩한다", () => {
    const date = new Date(2025, 2, 5); // 2025년 3월 5일
    expect(getSimpleDate(date)).toBe("20250305");
  });

  it("12월 31일을 올바르게 처리한다", () => {
    const date = new Date(2025, 11, 31); // 2025년 12월 31일
    expect(getSimpleDate(date)).toBe("20251231");
  });
});

describe("formatPostDate (게시글 날짜 포맷팅)", () => {
  it("7일 이내의 날짜는 상대 시간으로 반환한다", () => {
    // 현재 시간으로부터 1일 전
    const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    const result = formatPostDate(oneDayAgo);
    expect(result).toContain("전");
  });

  it("7일 이상 지난 날짜는 yyyy.MM.dd 형식으로 반환한다", () => {
    // 현재 시간으로부터 30일 전
    const thirtyDaysAgo = new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 30,
    ).toISOString();
    const result = formatPostDate(thirtyDaysAgo);
    expect(result).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
  });

  it("방금 전 날짜를 올바르게 처리한다", () => {
    const justNow = new Date().toISOString();
    const result = formatPostDate(justNow);
    // "1초 미만 전" 또는 유사한 표현이 포함되어야 함
    expect(result).toContain("전");
  });
});
