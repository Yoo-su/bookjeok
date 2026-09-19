import { bookSaleKeys, reviewKeys } from "@bookjeok/core";
import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/libs/axios", () => ({}));
import { ServerQueryBoundary } from "./server-query-boundary";

afterEach(() => vi.restoreAllMocks());

describe("ServerQueryBoundary 장애 처리", () => {
  it.each([false, true])(
    "핵심 쿼리 실패는 ISR 렌더를 실패시킨다 (infinite=%s)",
    async (infinite) => {
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      vi.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("backend unavailable");
      const query = {
        required: true,
        queryKey: reviewKeys.popular.queryKey,
        queryFn: async () => {
          throw error;
        },
      };
      await expect(
        ServerQueryBoundary({
          queryClient: client,
          children: null,
          queries: [
            infinite
              ? { ...query, type: "infinite", initialPageParam: null }
              : query,
          ],
        }),
      ).rejects.toThrow(error);
      client.clear();
    },
  );
  it("부가 쿼리 실패를 기록하고 성공한 쿼리 데이터는 유지한다", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await ServerQueryBoundary({
      queryClient: client,
      children: null,
      queries: [
        {
          queryKey: reviewKeys.popular.queryKey,
          queryFn: async () => {
            throw new Error("offline");
          },
        },
        {
          queryKey: bookSaleKeys.popularSales.queryKey,
          queryFn: async () => ["retained"],
        },
      ],
    });
    expect(log).toHaveBeenCalled();
    expect(client.getQueryData(bookSaleKeys.popularSales.queryKey)).toEqual([
      "retained",
    ]);
    client.clear();
  });
});
