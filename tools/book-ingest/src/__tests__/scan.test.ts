import { describe, expect, it, vi } from "vitest";

import { scanPublisher } from "../scan";
import type { BookSource, SourcePage } from "../sources";
import { createKakaoSource, type KakaoBook } from "../sources/kakao";
import { kakaoBook } from "./fixtures";

const book = (n: number, overrides: Partial<KakaoBook> = {}) =>
  kakaoBook({
    isbn: `89374775${String(n).padStart(2, "0")} 97889374775${String(n).padStart(2, "0")}`,
    title: `책 ${n}`,
    ...overrides,
  });

/** 정제는 실제 카카오 규칙을 쓰고, 검색만 가짜로 바꿉니다. */
function source(
  search: BookSource<KakaoBook>["search"],
): BookSource<KakaoBook> & { search: ReturnType<typeof vi.fn> } {
  return { ...createKakaoSource("key"), search: vi.fn(search) };
}

function pages(...docsPerPage: KakaoBook[][]) {
  return source(
    async (_publisher, page): Promise<SourcePage<KakaoBook>> => ({
      items: docsPerPage[Math.min(page, docsPerPage.length) - 1],
      totalCount: 5959,
      isEnd: page >= docsPerPage.length,
    }),
  );
}

describe("scanPublisher", () => {
  it("끝 페이지까지 훑어 DB에 없는 책만 신규로 고른다", async () => {
    const src = pages([book(1), book(2)], [book(3)]);
    const findExisting = vi.fn(async () => new Set(["9788937477502"]));

    const scan = await scanPublisher(
      "민음사",
      { source: src, findExisting },
      { today: "2026-09-23" },
    );

    expect(src.search).toHaveBeenCalledTimes(2);
    expect(scan.fresh.map((b) => b.title)).toEqual(["책 1", "책 3"]);
    expect(scan.known.map((b) => b.title)).toEqual(["책 2"]);
    expect(scan).toMatchObject({ source: "kakao", pages: 2 });
  });

  it("ISBN-10으로만 있는 기존 행도 보유로 친다", async () => {
    const findExisting = vi.fn(async () => new Set(["8937477501"]));

    const scan = await scanPublisher(
      "민음사",
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

    const scan = await scanPublisher(
      "민음사",
      { source: src, findExisting: async () => new Set() },
      { today: "2026-09-23", maxPages: 99 },
    );

    expect(src.search).toHaveBeenCalledTimes(src.maxPages);
    // 반복된 책은 한 번만 센다
    expect(scan.fresh).toHaveLength(1);
  });

  it("maxPages로 더 일찍 멈출 수 있다", async () => {
    const src = pages([book(1)], [book(2)], [book(3)]);
    await scanPublisher(
      "민음사",
      { source: src, findExisting: async () => new Set() },
      { today: "2026-09-23", maxPages: 2 },
    );
    expect(src.search).toHaveBeenCalledTimes(2);
  });

  it("제외 대상은 DB를 조회하지 않고 사유와 함께 모은다", async () => {
    const findExisting = vi.fn(async () => new Set<string>());

    const scan = await scanPublisher(
      "민음사",
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
    await scanPublisher(
      "민음사",
      {
        source: pages([book(1), book(2, { status: "" })]),
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
