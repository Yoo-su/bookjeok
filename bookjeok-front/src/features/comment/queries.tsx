"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { commentKeys } from "@/shared/constants/query-keys/comment";

import { getComments, getMyComments } from "./apis";
import { COMMENTS_PER_PAGE } from "./constants";
import { CommentTargetType } from "./types";

/**
 * 댓글 목록을 조회하는 쿼리 훅
 * @param targetType 타겟 타입 (BOOK | REVIEW)
 * @param targetId 타겟 ID (ISBN 또는 Review ID)
 * @param page 페이지 번호
 * @param enabled 쿼리 활성화 여부
 */
export const useCommentsQuery = (
  targetType: CommentTargetType,
  targetId: string,
  page: number = 1,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: QUERY_KEYS.commentKeys.list(targetType, targetId, page).queryKey,
    queryFn: () =>
      getComments({
        targetType,
        targetId,
        page,
        limit: COMMENTS_PER_PAGE,
      }),
    staleTime: 1000 * 60, // 1분
    enabled,
  });
};

/**
 * 내 댓글 목록을 무한 스크롤로 조회하는 훅
 */
export const useMyCommentsInfiniteQuery = (limit: number = 10) => {
  return useInfiniteQuery({
    queryKey: commentKeys.my.queryKey,
    queryFn: ({ pageParam = 1 }) => getMyComments(pageParam, limit),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};
