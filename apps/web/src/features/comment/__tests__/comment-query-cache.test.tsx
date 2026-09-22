import * as apis from "@bookjeok/api-client";
import {
  Comment,
  CommentTargetType,
  GetCommentsResponse,
} from "@bookjeok/core";
import { useCommentsQuery } from "@bookjeok/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@bookjeok/api-client", () => ({
  getComments: vi.fn(),
}));

const makeResponse = (content: string): GetCommentsResponse => ({
  data: [
    {
      id: 7,
      content,
      targetType: CommentTargetType.REVIEW,
      targetId: "42",
      userId: 2,
      user: {
        id: 2,
        handle: "reader",
        nickname: "독자",
        profileImageUrl: null,
      },
      likeCount: 1,
      isLiked: true,
      createdAt: "2026-09-22T00:00:00.000Z",
      updatedAt: "2026-09-22T00:00:00.000Z",
    } satisfies Comment,
  ],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
});

describe("useCommentsQuery viewer cache", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("같은 페이지를 다른 사용자가 조회하면 이전 사용자의 캐시를 재사용하지 않는다", async () => {
    vi.mocked(apis.getComments)
      .mockResolvedValueOnce(makeResponse("첫 번째 사용자"))
      .mockResolvedValueOnce(makeResponse("두 번째 사용자"));

    const first = renderHook(
      () => useCommentsQuery(CommentTargetType.REVIEW, "42", 1, 10, true, 10),
      { wrapper },
    );
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));

    const second = renderHook(
      () => useCommentsQuery(CommentTargetType.REVIEW, "42", 1, 10, true, 20),
      { wrapper },
    );
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));

    expect(first.result.current.data?.data[0].content).toBe("첫 번째 사용자");
    expect(second.result.current.data?.data[0].content).toBe("두 번째 사용자");
    expect(apis.getComments).toHaveBeenCalledTimes(2);
  });
});
