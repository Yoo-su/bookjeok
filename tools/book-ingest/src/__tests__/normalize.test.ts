import { describe, expect, it } from "vitest";

import {
  type Draft,
  formatAuthor,
  localToday,
  screen,
  toPubDate,
} from "../normalize";

const TODAY = "2026-09-23";

function draft(overrides: Partial<Draft> = {}): Draft {
  return {
    isbn13: "9788937477515",
    isbn10: "8937477513",
    title: "우리 착한 나진",
    publisher: "민음사",
    authors: ["이서수"],
    translators: [],
    price: 15000,
    pubDate: "2026-09-18",
    description: "소개",
    coverUrls: ["https://example.com/cover.jpg"],
    thumbnail: "https://example.com/thumb.jpg",
    salesPoint: 3670,
    status: "정상판매",
    category: null,
    link: "",
    ...overrides,
  };
}

describe("formatAuthor", () => {
  it("저자만 이름 그대로 ', '로 잇는다", () => {
    expect(formatAuthor(["김지연", "함윤이", "이서아"])).toBe(
      "김지연, 함윤이, 이서아",
    );
  });

  it("빈 배열은 빈 문자열", () => {
    expect(formatAuthor([])).toBe("");
    expect(formatAuthor(["", "  "])).toBe("");
  });

  it("같은 사람이 역할을 겸하면 한 번만 쓴다", () => {
    expect(formatAuthor(["에릭 오", "에릭 오"])).toBe("에릭 오");
  });
});

describe("toPubDate", () => {
  it("날짜 부분만 쓴다 — Date로 파싱하지 않아 KST에서 밀리지 않는다", () => {
    expect(toPubDate("2026-09-01T00:00:00.000+09:00")).toBe("2026-09-01");
    expect(toPubDate("2026-09-01")).toBe("2026-09-01");
  });

  it("비었거나 형식이 다르면 null", () => {
    expect(toPubDate("")).toBeNull();
    expect(toPubDate(undefined)).toBeNull();
    expect(toPubDate("2026/09/01")).toBeNull();
  });
});

describe("screen", () => {
  it("공급처 판매지수를 그대로 싣는다", () => {
    const result = screen("sample", draft(), {}, "민음사", TODAY);
    expect(result.ok && result.book).toMatchObject({
      source: "sample",
      salesPoint: 3670,
      discount: "15000",
    });
  });

  it("공급처 고유 사유는 공통 사유를 모두 통과한 뒤에 본다", () => {
    const rejection = { reason: "sample_rule", label: "공급처 고유 규칙" };
    const priced = screen(
      "sample",
      draft({ price: 0, rejection }),
      {},
      "민음사",
      TODAY,
    );
    expect(!priced.ok && priced.excluded.reason).toBe("no_price");

    const own = screen("sample", draft({ rejection }), {}, "민음사", TODAY);
    expect(!own.ok && own.excluded).toMatchObject(rejection);
  });

  it("표지 후보가 하나도 없으면 제외한다", () => {
    const result = screen("x", draft({ coverUrls: [] }), {}, "민음사", TODAY);
    expect(!result.ok && result.excluded.reason).toBe("no_cover");
  });
});

describe("localToday", () => {
  it("로컬 달력 날짜를 YYYY-MM-DD로", () => {
    expect(localToday(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
