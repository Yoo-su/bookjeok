import * as apis from "@bookjeok/api-client";
import { GetReviewsResponse, reviewKeys } from "@bookjeok/core";
import {
  useReviewsInfiniteQuery,
  useReviewsQuery,
} from "@bookjeok/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@bookjeok/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@bookjeok/api-client")>()),
  getReviews: vi.fn(),
}));

const page = {
  reviews: [],
  total: 0,
  nextCursor: null,
} as unknown as GetReviewsResponse;

describe("review list query keys", () => {
  it("keeps list and infinite shapes apart for the same params", async () => {
    vi.mocked(apis.getReviews).mockResolvedValue(page);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const params = { page: 1, limit: 20 };

    const { result } = renderHook(
      () => ({
        list: useReviewsQuery(params),
        infinite: useReviewsInfiniteQuery(params),
      }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.list.isSuccess).toBe(true);
      expect(result.current.infinite.isSuccess).toBe(true);
    });
    expect(result.current.list.data).toEqual(page);
    expect(result.current.infinite.data?.pages).toEqual([page]);
    expect(queryClient.getQueryData(reviewKeys.list(params).queryKey)).toEqual(
      page,
    );
  });

  it("invalidates both through the shared list prefix", async () => {
    vi.mocked(apis.getReviews).mockReset().mockResolvedValue(page);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => ({
        list: useReviewsQuery({ isbn: "9788937460777", limit: 4 }),
        infinite: useReviewsInfiniteQuery({ limit: 12 }),
      }),
      { wrapper },
    );
    await waitFor(() => {
      expect(result.current.list.isSuccess).toBe(true);
      expect(result.current.infinite.isSuccess).toBe(true);
    });
    expect(apis.getReviews).toHaveBeenCalledTimes(2);

    await act(() =>
      queryClient.invalidateQueries({ queryKey: reviewKeys.list._def }),
    );

    expect(apis.getReviews).toHaveBeenCalledTimes(4);
  });
});
