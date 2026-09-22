import * as apis from "@bookjeok/api-client";
import {
  Comment,
  commentKeys,
  CommentTargetType,
  GetCommentsResponse,
} from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useToggleCommentLikeMutation } from "@/features/comment/mutations";

vi.mock("@bookjeok/api-client", () => ({
  toggleCommentLike: vi.fn(),
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const targetType = CommentTargetType.REVIEW;
const targetId = "42";
const page = 1;
const viewerId = 10;
const comment = {
  id: 7,
  content: "댓글",
  targetType,
  targetId,
  userId: 2,
  user: {
    id: 2,
    handle: "reader",
    nickname: "독자",
    profileImageUrl: null,
  },
  likeCount: 1,
  isLiked: false,
  createdAt: "2026-09-22T00:00:00.000Z",
  updatedAt: "2026-09-22T00:00:00.000Z",
} satisfies Comment;

describe("useToggleCommentLikeMutation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    queryClient.setQueryData<GetCommentsResponse>(
      commentKeys.list(targetType, targetId, page, viewerId).queryKey,
      {
        data: [comment],
        meta: { total: 1, page, limit: 10, totalPages: 1 },
      },
    );
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("낙관적 상태와 서버 결과가 다르면 서버의 좋아요 상태와 개수로 확정한다", async () => {
    vi.mocked(apis.toggleCommentLike).mockResolvedValue({
      ...comment,
      likeCount: 0,
      isLiked: false,
    });

    const { result } = renderHook(
      () => useToggleCommentLikeMutation(targetType, targetId, page, viewerId),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate(comment.id);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<GetCommentsResponse>(
      commentKeys.list(targetType, targetId, page, viewerId).queryKey,
    );
    expect(cached?.data[0]).toMatchObject({
      id: comment.id,
      likeCount: 0,
      isLiked: false,
    });
  });
});
