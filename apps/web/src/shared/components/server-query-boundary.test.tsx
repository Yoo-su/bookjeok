import { bookSaleKeys, CACHE_TIME, reviewKeys } from "@bookjeok/core";
import { hydrate, QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/libs/axios", () => ({}));
import { dehydrateStable, ServerQueryBoundary } from "./server-query-boundary";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("dehydrateStable", () => {
  const snapshotAt = async (time: string) => {
    vi.useFakeTimers({ now: new Date(time) });
    const client = new QueryClient();
    await client.fetchQuery({
      queryKey: reviewKeys.popular.queryKey,
      queryFn: async () => ["same"],
    });
    return JSON.stringify(dehydrateStable(client));
  };

  it("데이터가 같으면 생성 시각이 달라도 출력이 같다", async () => {
    expect(await snapshotAt("2026-09-25T00:00:00Z")).toBe(
      await snapshotAt("2026-09-25T06:00:00Z"),
    );
  });

  it("새 클라이언트에는 stale로 복원되고 기존 캐시는 덮어쓰지 않는다", async () => {
    const server = new QueryClient();
    await server.fetchQuery({
      queryKey: reviewKeys.popular.queryKey,
      queryFn: async () => ["snapshot"],
    });
    const state = dehydrateStable(server);

    const fresh = new QueryClient();
    hydrate(fresh, state);
    const restored = fresh.getQueryCache().find({
      queryKey: reviewKeys.popular.queryKey,
    });
    expect(restored?.state.data).toEqual(["snapshot"]);
    // 전역 staleTime(1분) 기준으로 이미 stale → 마운트 시 refetch
    expect(restored?.isStaleByTime(CACHE_TIME.ONE_MINUTE)).toBe(true);

    const existing = new QueryClient();
    existing.setQueryData(reviewKeys.popular.queryKey, ["client"]);
    hydrate(existing, state);
    expect(existing.getQueryData(reviewKeys.popular.queryKey)).toEqual([
      "client",
    ]);
  });
});

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
