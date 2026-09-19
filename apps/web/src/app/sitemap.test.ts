import { getBookSales, getReviews } from "@bookjeok/api-client";
import { connection } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/libs/axios", () => ({}));
vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn,
}));
vi.mock("@bookjeok/api-client", () => ({
  getBookSales: vi.fn(),
  getReviews: vi.fn(),
}));

import sitemap from "./sitemap";

function reviews(ids: number[], hasNextPage = false) {
  return {
    reviews: ids.map((id) => ({
      id,
      isPublic: true,
      book: { isbn: "9791167376442" },
    })),
    page: 1,
    limit: 50,
    hasNextPage,
    nextCursor: hasNextPage ? ids.at(-1) : undefined,
  } as Awaited<ReturnType<typeof getReviews>>;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("VERCEL_ENV", "production");
  vi.mocked(getBookSales).mockResolvedValue({
    sales: [],
    page: 1,
    limit: 50,
    hasNextPage: false,
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("공개 콘텐츠 sitemap", () => {
  it("요청 시점에 도달하기 전에는 API를 호출하지 않는다", async () => {
    vi.mocked(connection).mockRejectedValueOnce(new Error("prerender bailout"));
    await expect(sitemap()).rejects.toThrow("prerender bailout");
    expect(getReviews).not.toHaveBeenCalled();
    expect(getBookSales).not.toHaveBeenCalled();
  });

  it("50건 뒤의 리뷰도 수집하고 도서 URL은 한 번만 포함한다", async () => {
    vi.mocked(getReviews)
      .mockResolvedValueOnce(
        reviews(
          Array.from({ length: 50 }, (_, i) => 100 - i),
          true,
        ),
      )
      .mockResolvedValueOnce(reviews([50, 49]));
    const entries = await sitemap();
    expect(getReviews).toHaveBeenNthCalledWith(2, {
      page: 1,
      limit: 50,
      cursorId: 51,
    });
    expect(entries.some((e) => e.url.endsWith("/reviews/49"))).toBe(true);
    expect(entries.filter((e) => e.url.endsWith("/detail"))).toHaveLength(1);
  });

  it("판매글 다음 커서도 순회한다", async () => {
    vi.mocked(getReviews).mockResolvedValue(reviews([]));
    vi.mocked(getBookSales)
      .mockResolvedValueOnce({
        sales: [],
        page: 1,
        limit: 50,
        hasNextPage: true,
        nextCursor: "cursor-a",
      })
      .mockResolvedValueOnce({
        sales: [],
        page: 1,
        limit: 50,
        hasNextPage: false,
      });
    await sitemap();
    expect(getBookSales).toHaveBeenNthCalledWith(2, {
      page: 1,
      limit: 50,
      cursor: "cursor-a",
    });
  });

  it("비공개 리뷰와 연결된 도서를 제외한다", async () => {
    const page = reviews([1]);
    page.reviews[0].isPublic = false;
    vi.mocked(getReviews).mockResolvedValue(page);
    expect(
      (await sitemap()).every(
        (e) => !e.url.endsWith("/reviews/1") && !e.url.endsWith("/detail"),
      ),
    ).toBe(true);
  });

  it("중간 실패는 부분 sitemap 대신 재생성 실패로 전파한다", async () => {
    vi.mocked(getReviews)
      .mockResolvedValueOnce(reviews([100], true))
      .mockRejectedValueOnce(new Error("offline"));
    await expect(sitemap()).rejects.toThrow("offline");
  });

  it("반복 커서는 무한 조회하지 않는다", async () => {
    vi.mocked(getReviews).mockResolvedValue(reviews([100], true));
    await expect(sitemap()).rejects.toThrow("cursor");
    expect(getReviews).toHaveBeenCalledTimes(2);
  });

  it("preview에서는 API를 호출하지 않는다", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(await sitemap()).toEqual([]);
    expect(getReviews).not.toHaveBeenCalled();
    expect(getBookSales).not.toHaveBeenCalled();
  });
});
