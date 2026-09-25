/** 알라딘 공급처 테스트. `sources/aladin.ts`와 함께 지웁니다. */
import { describe, expect, it, vi } from "vitest";

import {
  aladinCoverUrls,
  type AladinItem,
  createAladinSource,
  splitAladinAuthor,
} from "../sources/aladin";
import { candidate } from "./fixtures";

const TODAY = "2026-09-23";

/** 2026-09-23 실측 ItemSearch 응답과 같은 모양. */
function aladinItem(overrides: Partial<AladinItem> = {}): AladinItem {
  return {
    title: "순수",
    link: "https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=402798063&amp;partner=openAPI&amp;start=api",
    author: "가브리엘레 단눈치오 (지은이), 이현경 (옮긴이)",
    pubDate: "2026-09-22",
    description:
      "이탈리아 데카당스 문학을 대표하는 작가 가브리엘레 단눈치오의 장편 소설.",
    isbn: "8937465027",
    isbn13: "9788937465024",
    itemId: 402798063,
    priceSales: 14400,
    priceStandard: 16000,
    mallType: "BOOK",
    stockStatus: "",
    cover:
      "https://image.aladin.co.kr/product/40279/80/cover200/8937465027_1.jpg",
    categoryName: "국내도서>소설/시/희곡>세계의 소설>이탈리아소설",
    publisher: "민음사",
    salesPoint: 210,
    adult: false,
    ...overrides,
  };
}

/** 알라딘처럼 200과 `Output=js` 본문(끝 세미콜론 포함)을 돌려주는 가짜 요청. */
function respond(body: unknown) {
  return vi.fn(
    async (_url: string) => new Response(`${JSON.stringify(body)};`),
  );
}

describe("splitAladinAuthor", () => {
  it.each([
    [
      "가브리엘레 단눈치오 (지은이), 이현경 (옮긴이)",
      ["가브리엘레 단눈치오"],
      ["이현경"],
    ],
    [
      "천쓰홍, 찬와이 (지은이), 김태성, 문현선 (옮긴이)",
      ["천쓰홍", "찬와이"],
      ["김태성", "문현선"],
    ],
    // 엮은이·그림도 저자로 친다 — 카카오 authors[]와 같은 기준
    [
      "호라티우스 (지은이), 세계시인선 편집부 (엮은이), 파울 클레 (그림)",
      ["호라티우스", "세계시인선 편집부", "파울 클레"],
      [],
    ],
    ["하타 나오야 (그림)", ["하타 나오야"], []],
    ["역할 표기 없음", ["역할 표기 없음"], []],
    ["", [], []],
  ])("%s", (raw, authors, translators) => {
    expect(splitAladinAuthor(raw)).toEqual({ authors, translators });
  });
});

describe("aladinCoverUrls", () => {
  it("cover500을 먼저, 원래 주소를 폴백으로 둔다", () => {
    expect(aladinCoverUrls(aladinItem().cover)).toEqual([
      "https://image.aladin.co.kr/product/40279/80/cover500/8937465027_1.jpg",
      "https://image.aladin.co.kr/product/40279/80/cover200/8937465027_1.jpg",
    ]);
  });

  it("http는 https로, coversum도 cover500으로", () => {
    expect(
      aladinCoverUrls(
        "http://image.aladin.co.kr/product/1/2/coversum/x.jpg",
      )[0],
    ).toBe("https://image.aladin.co.kr/product/1/2/cover500/x.jpg");
  });

  it("noimg 자리표시나 빈 값은 표지 없음", () => {
    expect(
      aladinCoverUrls("https://image.aladin.co.kr/img/noimg_b.gif"),
    ).toEqual([]);
    expect(aladinCoverUrls("")).toEqual([]);
  });
});

describe("알라딘 normalize", () => {
  const normalize = (item: AladinItem) =>
    createAladinSource("key", respond({})).normalize(item, "민음사", TODAY);

  it("정가·판매지수·카테고리를 싣고 저자에서 역자를 뺀다", () => {
    const result = normalize(aladinItem());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.book).toMatchObject({
      source: "aladin",
      isbn: "9788937465024",
      isbn10: "8937465027",
      author: "가브리엘레 단눈치오",
      translators: ["이현경"],
      discount: "16000",
      pubDate: "2026-09-22",
      salesPoint: 210,
      status: "정상판매",
      category: "국내도서>소설/시/희곡>세계의 소설>이탈리아소설",
      link: "https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=402798063&partner=openAPI&start=api",
    });
    expect(result.book.coverUrls[0]).toContain("/cover500/");
  });

  it("판매지수 0은 그대로 0이다 — 알라딘의 실제 값", () => {
    const result = normalize(aladinItem({ salesPoint: 0 }));
    expect(result.ok && result.book.salesPoint).toBe(0);
  });

  it("예약판매는 포함하고 표시한다", () => {
    const result = normalize(
      aladinItem({ pubDate: "2026-10-05", stockStatus: "예약판매" }),
    );
    expect(result.ok && result.book).toMatchObject({
      preorder: true,
      status: "예약판매",
    });
  });

  it.each([
    // 알라딘 내부 코드(K…)만 있고 ISBN-13이 없는 상품 — 세트·특별판이 대부분
    ["no_isbn13", { isbn: "K202130901", isbn13: "" }],
    // 잡지 릿터: 호마다 같은 977 ISSN
    ["periodical", { isbn: "K142130036", isbn13: "9772508333003" }],
    ["set", { title: "민음사 세계문학전집 세트" }],
    ["no_price", { priceStandard: 0 }],
    ["adult", { adult: true }],
    [
      "no_cover",
      { cover: "https://image.aladin.co.kr/img/shop/2018/images/noimg.gif" },
    ],
    ["publisher_mismatch", { publisher: "민음인" }],
    // 2026 인생일력 — 13자리지만 ISBN이 아니다
    ["non_isbn", { isbn: "K000000000", isbn13: "2090000162264" }],
  ] as const)("%s이면 제외한다", (reason, overrides) => {
    const result = normalize(aladinItem(overrides));
    expect(!result.ok && result.excluded.reason).toBe(reason);
  });

  it("ISBN 자리의 내부 코드를 ISBN-10으로 쓰지 않는다", () => {
    const result = normalize(aladinItem({ isbn: "K122130072" }));
    expect(result.ok && result.book.isbn10).toBeNull();
  });
});

describe("알라딘 searchPublisher", () => {
  it("출판사 최신순으로 50권씩 요청한다", async () => {
    const request = respond({
      totalResults: 4313,
      startIndex: 1,
      item: Array.from({ length: 50 }, () => aladinItem()),
    });
    const page = await createAladinSource("key", request).searchPublisher(
      "민음사",
      1,
    );

    const url = new URL(request.mock.calls[0][0]);
    expect(url.pathname).toBe("/ttb/api/ItemSearch.aspx");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      Query: "민음사",
      QueryType: "Publisher",
      SearchTarget: "Book",
      Sort: "PublishTime",
      MaxResults: "50",
      Start: "1",
    });
    expect(page).toMatchObject({ totalCount: 4313, isEnd: false });
    expect(page.items).toHaveLength(50);
  });

  it("4페이지에서 끝으로 본다 — 결과가 더 있어도 200건까지만 준다", async () => {
    const request = respond({
      totalResults: 4313,
      startIndex: 4,
      item: Array.from({ length: 50 }, () => aladinItem()),
    });
    const page = await createAladinSource("key", request).searchPublisher(
      "민음사",
      4,
    );
    expect(page.isEnd).toBe(true);
  });

  it("요청한 페이지가 아닌 응답은 버리고 끝낸다 — 상한을 넘기면 1페이지를 다시 준다", async () => {
    const request = respond({
      totalResults: 4313,
      startIndex: 1,
      item: [aladinItem()],
    });
    const page = await createAladinSource("key", request).searchPublisher(
      "민음사",
      5,
    );
    expect(page).toEqual({ items: [], totalCount: 4313, isEnd: true });
  });

  it("200으로 온 오류 응답을 오류로 올린다", async () => {
    const request = respond({ errorCode: 10, errorMessage: "쿼터 초과" });
    await expect(
      createAladinSource("key", request).searchPublisher("민음사", 1),
    ).rejects.toThrow("알라딘 오류 10: 쿼터 초과");
  });
});

describe("알라딘 enrich", () => {
  const book = () =>
    candidate({
      source: "aladin",
      isbn: "9788937465024",
      description: "요약",
      salesPoint: 210,
    });

  it("출판사 소개를 우선해 HTML을 걷어 내고 판매지수를 갱신한다", async () => {
    const request = respond({
      item: [
        aladinItem({
          salesPoint: 260,
          fullDescription: "알라딘 소개",
          fullDescription2: "<b>출판사 소개</b><BR>둘째 줄",
        }),
      ],
    });
    const enriched = await createAladinSource("key", request).enrich!(book());

    const url = new URL(request.mock.calls[0][0]);
    expect(url.pathname).toBe("/ttb/api/ItemLookUp.aspx");
    // 판형도 같은 호출에서 받는다 — 쿼터를 더 쓰지 않는다
    expect(url.searchParams.get("OptResult")).toBe(
      "fulldescription,fulldescription2,packing",
    );
    expect(enriched).toMatchObject({
      description: "출판사 소개\n둘째 줄",
      salesPoint: 260,
    });
    expect((enriched.raw as AladinItem).fullDescription2).toContain("출판사");
  });

  it("출판사 소개가 없으면 알라딘 소개, 그것도 없으면 요약", async () => {
    const source = (item: AladinItem) =>
      createAladinSource("key", respond({ item: [item] }));
    expect(
      (
        await source(aladinItem({ fullDescription: "알라딘 소개" })).enrich!(
          book(),
        )
      ).description,
    ).toBe("알라딘 소개");
    expect(
      (await source(aladinItem({ description: "" })).enrich!(book()))
        .description,
    ).toBe("요약");
  });

  it("다른 책이 돌아오면 실패한다", async () => {
    const request = respond({
      item: [aladinItem({ isbn13: "9788937477515" })],
    });
    await expect(
      createAladinSource("key", request).enrich!(book()),
    ).rejects.toThrow("9788937465024");
  });

  it("판형·쪽수를 book_dimensions 규칙으로 싣는다", async () => {
    // 2026-09-25 실측 『사람, 장소, 환대』 응답의 subInfo
    const request = respond({
      item: [
        aladinItem({
          subInfo: {
            itemPage: 297,
            packing: {
              styleDesc: "반양장본",
              weight: 440,
              sizeDepth: 17,
              sizeHeight: 223,
              sizeWidth: 152,
            },
          },
        }),
      ],
    });
    const enriched = await createAladinSource("key", request).enrich!(book());
    expect(enriched.dimensions).toEqual({
      source: "aladin",
      width: 152,
      height: 223,
      depth: 17,
      pages: 297,
      weight: 440,
      binding: "반양장본",
    });
  });

  it("판형이 비어 있으면 dimensions는 null", async () => {
    const request = respond({
      item: [aladinItem({ subInfo: { packing: { styleDesc: "미확인" } } })],
    });
    const enriched = await createAladinSource("key", request).enrich!(book());
    expect(enriched.dimensions).toBeNull();
  });
});

describe("알라딘 searchKeyword", () => {
  it.each([
    ["all", "accuracy", "Keyword", "Accuracy"],
    ["title", "latest", "Title", "PublishTime"],
    ["author", "accuracy", "Author", "Accuracy"],
    // ISBN은 키워드 검색이 정확히 한 권을 찾는다(2026-09-25 실측)
    ["isbn", "accuracy", "Keyword", "Accuracy"],
  ] as const)(
    "%s·%s → QueryType %s, Sort %s",
    async (field, sort, type, order) => {
      const request = respond({ totalResults: 5, startIndex: 1, item: [] });
      await createAladinSource("key", request).searchKeyword(
        { text: "사탄탱고", field, sort },
        1,
      );
      const url = new URL(request.mock.calls[0][0]);
      expect(Object.fromEntries(url.searchParams)).toMatchObject({
        Query: "사탄탱고",
        QueryType: type,
        Sort: order,
        SearchTarget: "Book",
        MaxResults: "50",
      });
    },
  );
});

describe("알라딘 lookupDimensions", () => {
  const packing = {
    subInfo: {
      itemPage: 297,
      packing: { sizeWidth: 223, sizeHeight: 152, sizeDepth: 17 },
    },
  };

  it("ISBN으로 판형만 조회하고 가로·세로가 뒤바뀐 값을 바로잡는다", async () => {
    const request = respond({
      item: [aladinItem({ isbn13: "9788932027265", ...packing })],
    });
    const dims = await createAladinSource("key", request).lookupDimensions!(
      "9788932027265",
    );
    const url = new URL(request.mock.calls[0][0]);
    expect(url.searchParams.get("OptResult")).toBe("packing");
    expect(dims).toMatchObject({ width: 152, height: 223, depth: 17 });
  });

  it("알라딘에 없는 책(오류 8)이면 null", async () => {
    const request = respond({
      errorCode: 8,
      errorMessage: "키에 해당하는 상품이 존재하지 않습니다.",
    });
    await expect(
      createAladinSource("key", request).lookupDimensions!("9791199999996"),
    ).resolves.toBeNull();
  });

  it("쿼터·키 오류는 던진다 — 판형 없이 넣으면 나중에 채울 길이 없다", async () => {
    const request = respond({ errorCode: 10, errorMessage: "쿼터 초과" });
    await expect(
      createAladinSource("key", request).lookupDimensions!("9788932027265"),
    ).rejects.toThrow("알라딘 오류 10");
  });
});
