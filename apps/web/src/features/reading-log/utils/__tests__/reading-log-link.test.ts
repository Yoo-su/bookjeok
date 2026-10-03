import { describe, expect, it } from "vitest";

import { parseReadingLogLink, readingLogHref } from "../reading-log-link";

describe("readingLogHref", () => {
  it("날짜는 로컬 달력 날짜 그대로 적는다", () => {
    expect(readingLogHref({ date: new Date(2026, 9, 3) })).toBe(
      "/my-page/reading-log?date=2026-10-03",
    );
  });

  it("보기와 달을 함께 적는다", () => {
    expect(
      readingLogHref({ view: "calendar", month: new Date(2026, 0, 15) }),
    ).toBe("/my-page/reading-log?view=calendar&month=2026-01");
  });

  it("아무것도 없으면 페이지 주소만", () => {
    expect(readingLogHref({})).toBe("/my-page/reading-log");
  });
});

describe("parseReadingLogLink", () => {
  it("날짜를 로컬 자정으로 읽는다(UTC로 읽으면 하루 밀림)", () => {
    const link = parseReadingLogLink(new URLSearchParams("date=2026-10-03"));
    expect(link?.date?.getFullYear()).toBe(2026);
    expect(link?.date?.getMonth()).toBe(9);
    expect(link?.date?.getDate()).toBe(3);
  });

  it("주소에서 만든 링크를 그대로 되읽는다", () => {
    const href = readingLogHref({ view: "stack" });
    const link = parseReadingLogLink(new URL(href, "http://x").searchParams);
    expect(link).toEqual({ view: "stack" });
  });

  it("모르는 보기와 잘못된 날짜는 버린다", () => {
    expect(
      parseReadingLogLink(new URLSearchParams("view=tower&date=2026-13-40")),
    ).toBeNull();
  });
});
