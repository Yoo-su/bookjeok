import { describe, expect, it, vi } from "vitest";

import {
  buildListTarget,
  listWeeks,
  parseKeywordQuery,
  scanTarget,
} from "../scan";
import type { BookSource, SourcePage } from "../sources";
import { createKakaoSource, type KakaoBook } from "../sources/kakao";
import { kakaoBook, LIST_CATALOG } from "./fixtures";

const book = (n: number, overrides: Partial<KakaoBook> = {}) =>
  kakaoBook({
    isbn: `89374775${String(n).padStart(2, "0")} 97889374775${String(n).padStart(2, "0")}`,
    title: `책 ${n}`,
    ...overrides,
  });

type Search = (_query: unknown, page: number) => Promise<SourcePage<KakaoBook>>;

/** 정제는 실제 카카오 규칙을 쓰고, 검색만 가짜로 바꿉니다. */
function source(search: Search) {
  return {
    ...createKakaoSource("key"),
    searchPublisher: vi.fn(search),
    searchKeyword: vi.fn(search),
  } satisfies BookSource<KakaoBook>;
}

function pages(...docsPerPage: KakaoBook[][]) {
  return source(async (_query, page) => ({
    items: docsPerPage[Math.min(page, docsPerPage.length) - 1],
    totalCount: 5959,
    isEnd: page >= docsPerPage.length,
  }));
}

const publisher = (name: string) =>
  ({ kind: "publisher", publisher: name }) as const;

describe("scanTarget — 출판사", () => {
  it("끝 페이지까지 훑어 DB에 없는 책만 신규로 고른다", async () => {
    const src = pages([book(1), book(2)], [book(3)]);
    const findExisting = vi.fn(async () => new Set(["9788937477502"]));

    const scan = await scanTarget(
      publisher("민음사"),
      { source: src, findExisting },
      { today: "2026-09-23" },
    );

    expect(src.searchPublisher).toHaveBeenCalledTimes(2);
    expect(scan.fresh.map((b) => b.title)).toEqual(["책 1", "책 3"]);
    expect(scan.known.map((b) => b.title)).toEqual(["책 2"]);
    expect(scan).toMatchObject({ source: "kakao", pages: 2, label: "민음사" });
  });

  it("ISBN-10으로만 있는 기존 행도 보유로 친다", async () => {
    const findExisting = vi.fn(async () => new Set(["8937477501"]));

    const scan = await scanTarget(
      publisher("민음사"),
      { source: pages([book(1)]), findExisting },
      { today: "2026-09-23" },
    );

    expect(findExisting).toHaveBeenCalledWith(["9788937477501", "8937477501"]);
    expect(scan.fresh).toHaveLength(0);
    expect(scan.known).toHaveLength(1);
  });

  it("끝나지 않아도 공급처 상한에서 멈춘다 — 상한을 넘기면 앞 페이지를 반복하기 때문", async () => {
    const src = source(async () => ({
      items: [book(1)],
      totalCount: 5959,
      isEnd: false,
    }));

    const scan = await scanTarget(
      publisher("민음사"),
      { source: src, findExisting: async () => new Set() },
      { today: "2026-09-23", maxPages: 99 },
    );

    expect(src.searchPublisher).toHaveBeenCalledTimes(src.maxPages);
    // 반복된 책은 한 번만 센다
    expect(scan.fresh).toHaveLength(1);
  });

  it("maxPages로 더 일찍 멈출 수 있다", async () => {
    const src = pages([book(1)], [book(2)], [book(3)]);
    await scanTarget(
      publisher("민음사"),
      { source: src, findExisting: async () => new Set() },
      { today: "2026-09-23", maxPages: 2 },
    );
    expect(src.searchPublisher).toHaveBeenCalledTimes(2);
  });

  it("제외 대상은 DB를 조회하지 않고 사유와 함께 모은다", async () => {
    const findExisting = vi.fn(async () => new Set<string>());

    const scan = await scanTarget(
      publisher("민음사"),
      {
        source: pages([
          book(1, { price: 0 }),
          book(2, { title: "1~10권 세트" }),
        ]),
        findExisting,
      },
      { today: "2026-09-23" },
    );

    expect(findExisting).not.toHaveBeenCalled();
    expect(scan.excluded.map((e) => e.reason)).toEqual(["no_price", "set"]);
  });

  it("페이지마다 진행 상황을 알린다", async () => {
    const onPage = vi.fn();
    await scanTarget(
      publisher("민음사"),
      {
        source: pages([book(1), book(2, { status: "" })]),
        findExisting: async () => new Set(),
      },
      { today: "2026-09-23", onPage },
    );
    expect(onPage).toHaveBeenCalledWith({
      label: "민음사",
      page: 1,
      totalCount: 5959,
      fresh: 1,
      known: 0,
      excluded: 1,
    });
  });
});

describe("scanTarget — 자유 검색", () => {
  const keyword = (text: string) =>
    ({
      kind: "keyword",
      query: { text, field: "all", sort: "accuracy" },
    }) as const;

  it("검색어로 찾고 출판사를 대조하지 않는다", async () => {
    const src = pages([
      book(1, { publisher: "알마" }),
      book(2, { publisher: "코프키노" }),
    ]);

    const scan = await scanTarget(
      keyword("사탄탱고"),
      { source: src, findExisting: async () => new Set(["9788937477502"]) },
      { today: "2026-09-25", maxPages: 1 },
    );

    expect(src.searchKeyword).toHaveBeenCalledWith(
      { text: "사탄탱고", field: "all", sort: "accuracy" },
      1,
    );
    expect(src.searchPublisher).not.toHaveBeenCalled();
    expect(scan.fresh.map((b) => b.publisher)).toEqual(["알마"]);
    expect(scan.known.map((b) => b.publisher)).toEqual(["코프키노"]);
    expect(scan.label).toBe('검색 "사탄탱고"');
  });

  it("출판사 외 제외 규칙은 그대로 적용한다 — 전자책·세트", async () => {
    const scan = await scanTarget(
      keyword("사탄탱고"),
      {
        source: pages([
          book(1, { sale_price: -1 }),
          book(2, { title: "노벨 문학 세트" }),
        ]),
        findExisting: async () => new Set(),
      },
      { today: "2026-09-25" },
    );
    expect(scan.excluded.map((e) => e.reason)).toEqual(["ebook", "set"]);
  });
});

describe("parseKeywordQuery", () => {
  it("공백을 정리하고 필드·정렬을 유지한다", () => {
    expect(parseKeywordQuery("  사탄   탱고 ", "title", "latest")).toEqual({
      text: "사탄 탱고",
      field: "title",
      sort: "latest",
    });
  });

  it.each([
    ["978-89-320-2726-5", "9788932027265"],
    ["89 320 2726 9", "8932027269"],
    ["114160387x", "114160387X"],
  ])("%s는 필드와 관계없이 ISBN 검색", (text, isbn) => {
    expect(parseKeywordQuery(text, "title")).toEqual({
      text: isbn,
      field: "isbn",
      sort: "accuracy",
    });
  });

  it("ISBN 모양이 아닌데 isbn 필드면 전체 검색으로 돌린다", () => {
    expect(parseKeywordQuery("사탄탱고", "isbn")?.field).toBe("all");
  });

  it("비었거나 100자를 넘으면 null", () => {
    expect(parseKeywordQuery("   ")).toBeNull();
    expect(parseKeywordQuery("가".repeat(101))).toBeNull();
  });
});

describe("scanTarget — 목록 여러 개", () => {
  const query = (categoryId: string) => ({
    type: "Bestseller",
    categoryId,
    week: null,
  });
  const target = {
    kind: "lists" as const,
    label: "베스트셀러",
    lists: [
      { label: "종합", query: query("0") },
      { label: "소설", query: query("1") },
      { label: "에세이", query: query("55889") },
    ],
  };
  const withLists = (
    search: (
      q: { categoryId: string },
      page: number,
    ) => Promise<SourcePage<KakaoBook>>,
  ) => ({
    ...pages([]),
    lists: {
      catalog: { ...LIST_CATALOG, maxPages: 2 },
      search: vi.fn(search),
    },
  });

  it("목록을 차례로 훑어 한 결과로 합치고, 목록끼리 겹치는 책은 한 번만 센다", async () => {
    const byCategory: Record<string, KakaoBook[]> = {
      "0": [book(1), book(2)],
      "1": [book(2), book(3)],
      "55889": [book(4)],
    };
    const src = withLists(async (q) => ({
      items: byCategory[q.categoryId],
      totalCount: 1000,
      isEnd: true,
    }));
    const findExisting = vi.fn(async () => new Set(["9788937477503"]));

    const scan = await scanTarget(
      target,
      { source: src, findExisting },
      { today: "2026-09-26" },
    );

    expect(scan.fresh.map((b) => b.title)).toEqual(["책 1", "책 2", "책 4"]);
    expect(scan.known.map((b) => b.title)).toEqual(["책 3"]);
    expect(scan).toMatchObject({ lists: 3, pages: 3, label: "베스트셀러" });
    expect(scan.incomplete).toBeUndefined();
  });

  it("목록마다 페이지 상한(catalog.maxPages)까지 넘긴다", async () => {
    const src = withLists(async () => ({
      items: [book(1)],
      totalCount: 1000,
      isEnd: false,
    }));
    await scanTarget(
      { ...target, lists: target.lists.slice(0, 1) },
      { source: src, findExisting: async () => new Set() },
      { today: "2026-09-26", maxPages: 99 },
    );
    expect(src.lists.search).toHaveBeenCalledTimes(2);
  });

  it("도중에 쿼터가 끊기면 받은 데까지 남기고 멈춘 이유를 적는다", async () => {
    const src = withLists(async (q) => {
      if (q.categoryId === "1") throw new Error("알라딘 오류 10: 쿼터 초과");
      return { items: [book(1)], totalCount: 1000, isEnd: true };
    });

    const scan = await scanTarget(
      target,
      { source: src, findExisting: async () => new Set() },
      { today: "2026-09-26" },
    );

    expect(scan.fresh.map((b) => b.title)).toEqual(["책 1"]);
    expect(scan.lists).toBe(1);
    expect(scan.incomplete).toBe("소설에서 멈춤 — 알라딘 오류 10: 쿼터 초과");
    // 세 번째 목록은 부르지 않는다
    expect(src.lists.search).toHaveBeenCalledTimes(2);
  });

  it("목록을 주지 않는 공급처면 던진다", async () => {
    await expect(
      scanTarget(
        target,
        { source: pages([]), findExisting: async () => new Set() },
        { today: "2026-09-26" },
      ),
    ).rejects.toThrow("목록을 주지 않습니다");
  });
});

describe("listWeeks", () => {
  it("이번 주를 먼저, 지난달부터 거꾸로 달마다 1주차", () => {
    expect(listWeeks(3, "month", "2026-02-10")).toEqual([
      null,
      { year: 2026, month: 1, week: 1 },
      { year: 2025, month: 12, week: 1 },
    ]);
  });

  it("매주면 1~4주차", () => {
    expect(listWeeks(2, "week", "2026-09-26")).toEqual([
      null,
      { year: 2026, month: 8, week: 1 },
      { year: 2026, month: 8, week: 2 },
      { year: 2026, month: 8, week: 3 },
      { year: 2026, month: 8, week: 4 },
    ]);
  });

  it("받을 수 있는 해(since) 전으로는 가지 않는다", () => {
    const weeks = listWeeks(999, "month", "2001-03-01", 2000);
    expect(weeks).toHaveLength(1 + 14);
    expect(weeks.at(-1)).toEqual({ year: 2000, month: 1, week: 1 });
  });
});

describe("buildListTarget", () => {
  it("과거 주차가 없는 목록은 기간과 관계없이 이번 것 하나", () => {
    const target = buildListTarget(
      LIST_CATALOG,
      { type: "BlogBest", categoryIds: ["0"], months: 60, interval: "week" },
      "2026-09-26",
    );
    expect(
      typeof target !== "string" && target.kind === "lists" && target.lists,
    ).toEqual([
      {
        label: "블로거 베스트 종합 이번 주",
        query: { type: "BlogBest", categoryId: "0", week: null },
      },
    ]);
  });

  it("분야가 많으면 이름을 줄여 붙인다", () => {
    const target = buildListTarget(
      LIST_CATALOG,
      {
        type: "Bestseller",
        categoryIds: ["0", "1", "74", "170", "336"],
        months: 12,
        interval: "month",
      },
      "2026-09-26",
    );
    expect(
      typeof target !== "string" && target.kind === "lists" && target.label,
    ).toBe("베스트셀러 · 종합·소설/시/희곡·역사 외 2개 · 최근 12개월·월 1회");
  });
});
