import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createKakaoSource,
  type KakaoBook,
  originalCoverUrl,
  parseIsbn,
} from "../sources/kakao";
import { kakaoBook } from "./fixtures";

const TODAY = "2026-09-23";
const normalize = (doc: KakaoBook) =>
  createKakaoSource("key").normalize(doc, "민음사", TODAY);

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

describe("카카오 normalize", () => {
  it("정상 도서를 books 형태로 바꾼다", () => {
    const result = normalize(
      kakaoBook({ translators: ["엄지영"], authors: ["알레한드로 삼브라"] }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.book).toMatchObject({
      source: "kakao",
      isbn: "9788937477515",
      isbn10: "8937477513",
      author: "알레한드로 삼브라",
      translators: ["엄지영"],
      discount: "15000",
      pubDate: "2026-09-18",
      salesPoint: null,
      preorder: false,
      coverUrls: [
        "http://t1.daumcdn.net/lbook/image/7309964?timestamp=20260922121507",
      ],
    });
  });

  it("HTML 엔티티만 풀고 그 밖의 가공은 하지 않는다", () => {
    const result = normalize(kakaoBook({ title: "톰 &amp; 제리 (리커버)" }));
    expect(result.ok && result.book.title).toBe("톰 & 제리 (리커버)");
  });

  it("출간일이 오늘 이후면 예약판매로 표시하되 적재 대상이다", () => {
    const result = normalize(
      kakaoBook({
        datetime: "2026-11-01T00:00:00.000+09:00",
        status: "예약판매",
      }),
    );
    expect(result.ok && result.book.preorder).toBe(true);
  });

  it("저자가 비어도 제외하지 않고 빈 문자열로 둔다", () => {
    const result = normalize(kakaoBook({ authors: [] }));
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
    // 『딸기 이론』 전자책 — 종이책(9788937449314)은 이미 DB에 있다
    ["ebook", { isbn: " 9788937449321", sale_price: -1 }],
    [
      "non_isbn",
      { isbn: " 2090000164114", title: "[어린이 책Dream] 할머니의 여름휴가" },
    ],
    ["no_cover", { thumbnail: "" }],
  ] as const)("%s이면 제외한다", (reason, overrides) => {
    const result = normalize(kakaoBook(overrides));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.excluded.reason).toBe(reason);
  });

  it("출판사 비교는 앞뒤·연속 공백을 무시한다", () => {
    expect(normalize(kakaoBook({ publisher: " 민음사 " })).ok).toBe(true);
  });
});

describe("카카오 검색 요청", () => {
  afterEach(() => vi.restoreAllMocks());

  const capture = () =>
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            documents: [],
            meta: { is_end: true, pageable_count: 0, total_count: 0 },
          }),
        ),
    );
  const params = (spy: ReturnType<typeof capture>) =>
    Object.fromEntries(new URL(String(spy.mock.calls[0][0])).searchParams);

  it("출판사 신간은 target=publisher, 최신순", async () => {
    const spy = capture();
    await createKakaoSource("key").searchPublisher("민음사", 2);
    expect(params(spy)).toEqual({
      query: "민음사",
      target: "publisher",
      sort: "latest",
      size: "50",
      page: "2",
    });
  });

  it.each([
    ["all", undefined],
    ["title", "title"],
    ["author", "person"],
    ["isbn", "isbn"],
  ] as const)("자유 검색 %s → target %s", async (field, target) => {
    const spy = capture();
    await createKakaoSource("key").searchKeyword(
      { text: "사탄탱고", field, sort: "accuracy" },
      1,
    );
    expect(params(spy)).toEqual({
      query: "사탄탱고",
      sort: "accuracy",
      size: "50",
      page: "1",
      ...(target ? { target } : {}),
    });
  });
});
