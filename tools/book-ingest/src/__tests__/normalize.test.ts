import { describe, expect, it } from "vitest";

import {
  formatAuthor,
  localToday,
  normalizeBook,
  originalCoverUrl,
  parseIsbn,
  toPubDate,
} from "../normalize";
import { kakaoBook } from "./fixtures";

const TODAY = "2026-09-23";

describe("parseIsbn", () => {
  it("ISBN10·13을 공백으로 붙인 값을 나눈다", () => {
    expect(parseIsbn("8937477513 9788937477515")).toEqual({
      isbn13: "9788937477515",
      isbn10: "8937477513",
    });
  });

  it("앞이 빈 값(' 13자리')도 읽는다", () => {
    expect(parseIsbn(" 9788937449475")).toEqual({
      isbn13: "9788937449475",
      isbn10: null,
    });
  });

  it("끝자리 X인 ISBN10을 대문자로 맞춘다", () => {
    expect(parseIsbn("114160387x 9791141603878").isbn10).toBe("114160387X");
  });
});

describe("originalCoverUrl", () => {
  it("썸네일의 fname에서 원본 주소를 꺼낸다", () => {
    expect(originalCoverUrl(kakaoBook().thumbnail)).toBe(
      "http://t1.daumcdn.net/lbook/image/7309964?timestamp=20260922121507",
    );
  });

  it("fname이 없거나 비어 있으면 null — 120px 썸네일로 대신하지 않는다", () => {
    expect(
      originalCoverUrl("https://search1.kakaocdn.net/thumb/R120x174.q85/"),
    ).toBeNull();
    expect(originalCoverUrl("")).toBeNull();
    expect(originalCoverUrl("not a url")).toBeNull();
  });
});

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
});

describe("toPubDate", () => {
  it("날짜 부분만 쓴다 — Date로 파싱하지 않아 KST에서 밀리지 않는다", () => {
    expect(toPubDate("2026-09-01T00:00:00.000+09:00")).toBe("2026-09-01");
  });

  it("비었거나 형식이 다르면 null", () => {
    expect(toPubDate("")).toBeNull();
    expect(toPubDate("2026/09/01")).toBeNull();
  });
});

describe("normalizeBook", () => {
  it("정상 도서를 books 형태로 바꾼다", () => {
    const result = normalizeBook(
      kakaoBook({ translators: ["엄지영"], authors: ["알레한드로 삼브라"] }),
      "민음사",
      TODAY,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.book).toMatchObject({
      isbn: "9788937477515",
      isbn10: "8937477513",
      author: "알레한드로 삼브라",
      discount: "15000",
      pubDate: "2026-09-18",
      preorder: false,
    });
    // 역자는 author에 넣지 않고 원본에만 남는다
    expect(result.book.kakao.translators).toEqual(["엄지영"]);
  });

  it("HTML 엔티티만 풀고 그 밖의 가공은 하지 않는다", () => {
    const result = normalizeBook(
      kakaoBook({ title: "톰 &amp; 제리 (리커버)" }),
      "민음사",
      TODAY,
    );
    expect(result.ok && result.book.title).toBe("톰 & 제리 (리커버)");
  });

  it("출간일이 오늘 이후면 예약판매로 표시하되 적재 대상이다", () => {
    const result = normalizeBook(
      kakaoBook({
        datetime: "2026-11-01T00:00:00.000+09:00",
        status: "예약판매",
      }),
      "민음사",
      TODAY,
    );
    expect(result.ok && result.book.preorder).toBe(true);
  });

  it("저자가 비어도 제외하지 않고 빈 문자열로 둔다", () => {
    const result = normalizeBook(kakaoBook({ authors: [] }), "민음사", TODAY);
    expect(result.ok && result.book.author).toBe("");
  });

  it.each([
    ["publisher_mismatch", { publisher: "민음사 편집부" }],
    ["no_title", { title: "  " }],
    ["no_isbn13", { isbn: "8937477513 " }],
    [
      "periodical",
      {
        isbn: "9772384367000 9772384367000",
        title: "악스트 Axt (2026년 7/8월호)",
      },
    ],
    ["set", { title: "박경리 큐레이션 리커버 세트" }],
    ["no_price", { price: 0 }],
    ["no_status", { status: "" }],
    ["no_cover", { thumbnail: "" }],
  ] as const)("%s이면 제외한다", (reason, overrides) => {
    const result = normalizeBook(kakaoBook(overrides), "민음사", TODAY);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.excluded.reason).toBe(reason);
  });

  it("출판사 비교는 앞뒤·연속 공백을 무시한다", () => {
    expect(
      normalizeBook(kakaoBook({ publisher: " 민음사 " }), "민음사", TODAY).ok,
    ).toBe(true);
  });
});

describe("localToday", () => {
  it("로컬 달력 날짜를 YYYY-MM-DD로", () => {
    expect(localToday(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
