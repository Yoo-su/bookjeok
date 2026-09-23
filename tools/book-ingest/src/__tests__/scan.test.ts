import { describe, expect, it, vi } from "vitest";

import type { KakaoBook, KakaoPage } from "../kakao";
import { scanPublisher } from "../scan";
import { kakaoBook } from "./fixtures";

const book = (n: number, overrides: Partial<KakaoBook> = {}) =>
  kakaoBook({
    isbn: `89374775${String(n).padStart(2, "0")} 97889374775${String(n).padStart(2, "0")}`,
    title: `책 ${n}`,
    ...overrides,
  });

function pages(...docsPerPage: KakaoBook[][]) {
  return vi.fn(async (_publisher: string, page: number): Promise<KakaoPage> => {
    const documents = docsPerPage[Math.min(page, docsPerPage.length) - 1];
    return {
      documents,
      meta: {
        is_end: page >= docsPerPage.length,
        pageable_count: 1000,
        total_count: 5959,
      },
    };
  });
}

describe("scanPublisher", () => {
  it("is_end까지 훑어 DB에 없는 책만 신규로 고른다", async () => {
    const search = pages([book(1), book(2)], [book(3)]);
    const findExisting = vi.fn(async () => new Set(["9788937477502"]));

    const scan = await scanPublisher(
      "민음사",
      { search, findExisting },
      { today: "2026-09-23" },
    );

    expect(search).toHaveBeenCalledTimes(2);
    expect(scan.fresh.map((b) => b.title)).toEqual(["책 1", "책 3"]);
    expect(scan.known.map((b) => b.title)).toEqual(["책 2"]);
    expect(scan.pages).toBe(2);
  });

  it("ISBN-10으로만 있는 기존 행도 보유로 친다", async () => {
    const search = pages([book(1)]);
    const findExisting = vi.fn(async () => new Set(["8937477501"]));

    const scan = await scanPublisher(
      "민음사",
      { search, findExisting },
      { today: "2026-09-23" },
    );

    expect(findExisting).toHaveBeenCalledWith(["9788937477501", "8937477501"]);
    expect(scan.fresh).toHaveLength(0);
    expect(scan.known).toHaveLength(1);
  });

  it("페이지가 끝나지 않아도 20페이지에서 멈춘다 — 21페이지부터는 20페이지를 반복하기 때문", async () => {
    const search = vi.fn(
      async (): Promise<KakaoPage> => ({
        documents: [book(1)],
        meta: { is_end: false, pageable_count: 1000, total_count: 5959 },
      }),
    );

    const scan = await scanPublisher(
      "민음사",
      { search, findExisting: async () => new Set() },
      { today: "2026-09-23", maxPages: 99 },
    );

    expect(search).toHaveBeenCalledTimes(20);
    // 반복된 책은 한 번만 센다
    expect(scan.fresh).toHaveLength(1);
  });

  it("maxPages로 더 일찍 멈출 수 있다", async () => {
    const search = pages([book(1)], [book(2)], [book(3)]);
    await scanPublisher(
      "민음사",
      { search, findExisting: async () => new Set() },
      { today: "2026-09-23", maxPages: 2 },
    );
    expect(search).toHaveBeenCalledTimes(2);
  });

  it("제외 대상은 DB를 조회하지 않고 사유와 함께 모은다", async () => {
    const search = pages([
      book(1, { price: 0 }),
      book(2, { title: "1~10권 세트" }),
    ]);
    const findExisting = vi.fn(async () => new Set<string>());

    const scan = await scanPublisher(
      "민음사",
      { search, findExisting },
      { today: "2026-09-23" },
    );

    expect(findExisting).not.toHaveBeenCalled();
    expect(scan.excluded.map((e) => e.reason)).toEqual(["no_price", "set"]);
  });

  it("페이지마다 진행 상황을 알린다", async () => {
    const onPage = vi.fn();
    await scanPublisher(
      "민음사",
      {
        search: pages([book(1), book(2, { status: "" })]),
        findExisting: async () => new Set(),
      },
      { today: "2026-09-23", onPage },
    );
    expect(onPage).toHaveBeenCalledWith({
      publisher: "민음사",
      page: 1,
      totalCount: 5959,
      fresh: 1,
      known: 0,
      excluded: 1,
    });
  });
});
