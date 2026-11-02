import { describe, expect, it, vi } from "vitest";

import { createWebEnricher } from "../web/enrich";
import {
  assertComplete,
  completeCandidate,
  parseAladinDetail,
  parseDescription,
  parseYes24Depth,
} from "../web/fields";
import { WebAccessError } from "../web/request";
import { candidate } from "./fixtures";
import {
  aladinHtml,
  descriptionHtml,
  ISBN,
  yes24Html,
  yes24SearchHtml,
} from "./web-fixtures";

function setup() {
  const saved = new Map<string, string>();
  const cache = {
    read: async (key: string) => saved.get(key) ?? null,
    write: async (key: string, html: string) => {
      saved.set(key, html);
    },
  };
  const request = vi.fn(async (url: string) => {
    if (url.includes("wproduct.aspx")) return aladinHtml();
    if (url.includes("getContents.aspx")) return descriptionHtml;
    if (url.includes("/Product/Search")) return yes24SearchHtml;
    return yes24Html();
  });
  return {
    saved,
    request,
    enrich: createWebEnricher(request, cache, "2026-11-01"),
  };
}

describe("알라딘 전 필드 + YES24 두께", () => {
  it("부제 span은 제목에 포함하고 시리즈 링크는 포함하지 않는다", () => {
    const html = aladinHtml().replace(
      '<span class="Ere_bo_title">검증용 도서</span>',
      '<div><span class="Ere_bo_title">검증용 도서</span><span class="Ere_sub1_title">- 부제 전문</span><a class="Ere_sub1_title">시리즈 10</a></div>',
    );
    expect(parseAladinDetail(html, ISBN).draft.title).toBe(
      "검증용 도서 - 부제 전문",
    );
  });

  it("불완전한 알라딘 상세를 캐시하지 않아 보완된 값을 재시도에서 받는다", async () => {
    const { enrich, request, saved } = setup();
    const normal = request.getMockImplementation()!;
    request.mockImplementationOnce(async () =>
      aladinHtml().replace("541g", ""),
    );
    await expect(enrich(candidate({ isbn: ISBN }))).rejects.toThrow("weight");
    expect(saved.size).toBe(0);
    request.mockImplementation(normal);
    expect((await enrich(candidate({ isbn: ISBN }))).dimensions?.weight).toBe(
      541,
    );
    expect(request).toHaveBeenCalledTimes(5);
  });
  it("정가·전체 저자·알라딘 판형에 YES24 두께만 결합한다", async () => {
    const result = await setup().enrich(candidate({ isbn: ISBN }));
    expect(result).toMatchObject({
      isbn: ISBN,
      author: "저자 하나, 저자 둘",
      translators: ["역자"],
      discount: "18000",
      salesPoint: 2540,
      description: "전문 첫 문장 & 둘째.\n다음 문단.",
      dimensions: {
        width: 135,
        height: 205,
        depth: 30,
        weight: 541,
        pages: 416,
        binding: "반양장본",
      },
    });
    expect(result.raw).toMatchObject({ yes24: { isbn: ISBN, depth: 30 } });
  });
  it("같은 책 재시도는 성공한 네 페이지를 재요청하지 않는다", async () => {
    const { enrich, request } = setup();
    await enrich(candidate({ isbn: ISBN }));
    await enrich(candidate({ isbn: ISBN }));
    expect(request).toHaveBeenCalledTimes(4);
  });
  it("두께가 없으면 실패하고 실패한 상세만 다시 받아 완성한다", async () => {
    const { enrich, request } = setup();
    let missing = true;
    request.mockImplementation(async (url) => {
      if (url.includes("wproduct.aspx")) return aladinHtml();
      if (url.includes("getContents.aspx")) return descriptionHtml;
      if (url.includes("/Product/Search")) return yes24SearchHtml;
      return yes24Html(ISBN, missing ? "135*205mm" : "135*205*30mm");
    });
    await expect(enrich(candidate({ isbn: ISBN }))).rejects.toThrow(
      "두께 미확보",
    );
    missing = false;
    expect((await enrich(candidate({ isbn: ISBN }))).dimensions?.depth).toBe(
      30,
    );
    expect(request).toHaveBeenCalledTimes(5);
  });
  it("다른 ISBN·다른 출판사의 응답을 저장 후보로 만들지 않는다", async () => {
    expect(() => parseAladinDetail(aladinHtml(), "9788936481667")).toThrow(
      "ISBN 불일치",
    );
    expect(() => parseYes24Depth(yes24Html("9788936481667"), ISBN)).toThrow(
      "ISBN 불일치",
    );
    await expect(
      setup().enrich(candidate({ isbn: ISBN, publisher: "창비" })),
    ).rejects.toThrow("다른 출판사");
  });
  it("접근 제한이면 소개 폴백이나 다른 상품으로 우회하지 않는다", async () => {
    const { enrich, request } = setup();
    request.mockImplementation(async (url) => {
      if (url.includes("wproduct.aspx")) return aladinHtml();
      throw new WebAccessError("접근 제한");
    });
    await expect(enrich(candidate({ isbn: ISBN }))).rejects.toMatchObject({
      fatal: true,
    });
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("출판사 소개가 없으면 알라딘 소개 전문을 받는다", async () => {
    const { enrich, request } = setup();
    request.mockImplementation(async (url) => {
      if (url.includes("wproduct.aspx")) return aladinHtml();
      if (url.includes("name=PublisherDesc")) return "<div>소개 없음</div>";
      if (url.includes("name=Introduce"))
        return '<div id="div_Introduce_All">알라딘 소개 전문</div>';
      if (url.includes("/Product/Search")) return yes24SearchHtml;
      return yes24Html();
    });
    expect((await enrich(candidate({ isbn: ISBN }))).description).toBe(
      "알라딘 소개 전문",
    );
  });
  it("전문 영역이 없을 때 광고나 짧은 요약을 대신 저장하지 않는다", () => {
    expect(() =>
      parseDescription(
        '<div id="div_PublisherDesc_Short">요약</div>',
        "PublisherDesc",
      ),
    ).toThrow("전문 영역 없음");
  });
  it.each(["weight", "pages", "binding", "depth"] as const)(
    "%s 누락을 추정하지 않는다",
    (key) => {
      const book = completeCandidate(
        parseAladinDetail(aladinHtml(), ISBN),
        "소개",
        30,
        candidate({ isbn: ISBN }),
        "2026-11-01",
      );
      if (book.dimensions) book.dimensions[key] = null;
      expect(() => assertComplete(book)).toThrow(key);
    },
  );
  it("판매지수 0은 허용하고 누락은 실패시킨다", () => {
    const book = completeCandidate(
      parseAladinDetail(aladinHtml(), ISBN),
      "소개",
      30,
      candidate({ isbn: ISBN }),
      "2026-11-01",
    );
    expect(() => assertComplete({ ...book, salesPoint: 0 })).not.toThrow();
    expect(() => assertComplete({ ...book, salesPoint: null })).toThrow(
      "판매지수",
    );
  });
});
