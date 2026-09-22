"use client";
import { getComments, getMyComments } from "@bookjeok/api-client";
import { CACHE_TIME, commentKeys, CommentTargetType } from "@bookjeok/core";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

/**
 * 댓글 목록 조회
 */
export const useCommentsQuery = (
  targetType: CommentTargetType,
  targetId: string,
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true,
  viewerId?: number,
) => {
  return useQuery({
    queryKey: commentKeys.list(targetType, targetId, page, viewerId).queryKey,
    queryFn: () =>
      getComments({
        targetType,
        targetId,
        page,
        limit,
      }),
    enabled,
  });
};

/**
 * 내 댓글 목록 (무한 스크롤)
 */
export const useMyCommentsInfiniteQuery = (limit: number = 10) => {
  return useInfiniteQuery({
    queryKey: commentKeys.my.queryKey,
    queryFn: ({ pageParam }) =>
      getMyComments(1, limit, pageParam as number | undefined),
    getNextPageParam: (lastPage) => {
      return lastPage.meta.nextCursor ?? undefined;
    },
    initialPageParam: undefined as number | undefined,
    staleTime: CACHE_TIME.ONE_MINUTE,
  });
};
