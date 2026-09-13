import { afterEach, describe, expect, it, vi } from "vitest";

import { formatDate, formatRelativeTime } from "../format-date";

describe("formatDate", () => {
  const testDate = new Date("2026-08-27T15:30:00.000Z");

  it("ko 로케일에서 dateTime 포맷을 올바르게 변환한다", () => {
    const formatted = formatDate(testDate, "ko", "dateTime");
    // "2026.08.28 00:30" (KST 기준) or matching yyyy.MM.dd HH:mm pattern
    expect(formatted).toMatch(/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/);
    expect(formatted).not.toContain("오후");
  });

  it("ko 로케일에서 date 포맷을 올바르게 변환한다", () => {
    const formatted = formatDate(testDate, "ko", "date");
    expect(formatted).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
  });

  it("ko 로케일에서 monthDay 포맷을 올바르게 변환한다", () => {
    const formatted = formatDate(testDate, "ko", "monthDay");
    expect(formatted).toMatch(/^\d{1,2}월 \d{1,2}일$/);
  });

  it("유효하지 않은 날짜가 주어지면 빈 문자열을 반환한다", () => {
    expect(formatDate("invalid-date", "ko", "date")).toBe("");
  });
});

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("유효하지 않은 날짜가 주어지면 빈 문자열을 반환한다", () => {
    expect(formatRelativeTime("invalid-date", "ko")).toBe("");
  });

  // "지금"을 로컬 시각으로 고정한다. 고정 오프셋(+09:00)으로 쓰면 테스트가
  // 실행 환경 타임존에 따라 갈린다(CI는 보통 UTC).
  const freezeLocal = (hour: number, minute = 0) => {
    vi.useFakeTimers().setSystemTime(new Date(2026, 8, 13, hour, minute));
  };

  // 달력 날짜를 경과 시간으로 세면 보는 시각에 따라 값이 흔들린다.
  // UTC 자정 파싱까지 겹치면 오전에는 미래("약 9시간 후")로도 표시된다.
  it.each([0, 9, 15, 23])("오늘 날짜는 %s시에 봐도 '오늘'이다", (hour) => {
    freezeLocal(hour, 30);

    expect(formatRelativeTime("2026-09-13", "ko")).toBe("오늘");
  });

  it.each([0, 9, 15, 23])("어제 날짜는 %s시에 봐도 '어제'다", (hour) => {
    freezeLocal(hour, 30);

    expect(formatRelativeTime("2026-09-12", "ko")).toBe("어제");
  });

  it("이틀 이상은 달력 일수로 센다", () => {
    freezeLocal(23);

    expect(formatRelativeTime("2026-09-11", "ko")).toBe("2일 전");
    expect(formatRelativeTime("2026-09-10", "ko")).toBe("3일 전");
  });

  it("영어 로케일도 달력 일수로 센다", () => {
    freezeLocal(23);

    expect(formatRelativeTime("2026-09-13", "en")).toBe("Today");
    expect(formatRelativeTime("2026-09-12", "en")).toBe("Yesterday");
  });

  it("오프셋이 붙은 타임스탬프는 기존대로 경과 시간으로 센다", () => {
    freezeLocal(23);

    const threeHoursAgo = new Date(2026, 8, 13, 20).toISOString();
    expect(formatRelativeTime(threeHoursAgo, "ko")).toContain("시간");
  });
});

describe("달력 날짜(YYYY-MM-DD) 처리", () => {
  // 시각이 없는 값이므로 보는 사람의 타임존과 무관하게 같은 날짜여야 한다.
  // UTC보다 뒤진 타임존에서 UTC 자정으로 파싱하면 하루 전으로 찍힌다.
  it("날짜만 있는 문자열을 그대로 그 날짜로 표시한다", () => {
    expect(formatDate("2026-09-13", "ko", "date")).toBe("2026.09.13");
    expect(formatDate("2026-01-01", "ko", "date")).toBe("2026.01.01");
  });

  it("오프셋이 붙은 타임스탬프는 순간 값으로 그대로 다룬다", () => {
    // 2026-09-13T20:00Z = KST 9/14 05:00. 로컬 자정으로 바꾸면 안 된다.
    const formatted = formatDate("2026-09-13T20:00:00.000Z", "ko", "dateTime");
    expect(formatted).toMatch(/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/);
  });
});
