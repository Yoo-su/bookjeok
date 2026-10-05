import * as apis from "@bookjeok/api-client";
import { AiBookSummaryData, bookKeys } from "@bookjeok/core";
import { useBookSummaryQuery } from "@bookjeok/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { prefetchBookSummary } from "@/features/book/queries/prefetch";
import { dehydrateStable } from "@/shared/components/server-query-boundary";
import { getQueryClient } from "@/shared/libs/query-client";

vi.mock("@bookjeok/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@bookjeok/api-client")>()),
  getSavedBookSummary: vi.fn(),
}));

const ISBN = "9788937460777";
const summary: AiBookSummaryData = {
  isbn: ISBN,
  summary: "저장된 요약",
  keyPoints: ["하나"],
  targetAudience: "독자",
  keywords: ["성장"],
};
const getSavedBookSummary = vi.mocked(apis.getSavedBookSummary);

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

afterEach(() => {
  getSavedBookSummary.mockReset();
  getQueryClient().clear();
});

describe("useBookSummaryQuery", () => {
  it("caches a missing summary as null", async () => {
    getSavedBookSummary.mockResolvedValue(null);
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useBookSummaryQuery(ISBN), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("does not cache a failed lookup as absent and refetches after recovery", async () => {
    getSavedBookSummary
      .mockRejectedValueOnce(new Error("503"))
      .mockResolvedValueOnce(summary);
    const queryClient = new QueryClient();
    const wrapper = createWrapper(queryClient);

    const first = renderHook(() => useBookSummaryQuery(ISBN), { wrapper });
    await waitFor(() => expect(first.result.current.isError).toBe(true));
    expect(first.result.current.data).toBeUndefined();
    expect(
      queryClient.getQueryState(bookKeys.summary(ISBN).queryKey)?.status,
    ).toBe("error");
    first.unmount();

    const second = renderHook(() => useBookSummaryQuery(ISBN), { wrapper });
    await waitFor(() => expect(second.result.current.data).toEqual(summary));
    expect(getSavedBookSummary).toHaveBeenCalledTimes(2);
  });
});

describe("prefetchBookSummary", () => {
  it("seeds a missing summary as null", async () => {
    getSavedBookSummary.mockResolvedValue(null);
    const queryClient = getQueryClient();

    await prefetchBookSummary(queryClient, ISBN);

    const seeded = dehydrateStable(queryClient).queries;
    expect(seeded).toHaveLength(1);
    expect(seeded[0].state.data).toBeNull();
  });

  it("leaves a failed lookup out of the seed without retrying", async () => {
    getSavedBookSummary.mockRejectedValue(new Error("503"));
    const queryClient = getQueryClient();

    await prefetchBookSummary(queryClient, ISBN);

    expect(getSavedBookSummary).toHaveBeenCalledTimes(1);
    expect(dehydrateStable(queryClient).queries).toHaveLength(0);
  });
});
