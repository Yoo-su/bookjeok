"use client";
import { getAdminFeedback, getMyFeedback } from "@bookjeok/api-client";
import { feedbackKeys, GetAdminFeedbackParams } from "@bookjeok/core";
import { useInfiniteQuery } from "@tanstack/react-query";

/**
 * 내가 보낸 문의 (무한 스크롤)
 */
export const useMyFeedbackInfiniteQuery = () => {
  return useInfiniteQuery({
    queryKey: feedbackKeys.my.queryKey,
    queryFn: ({ pageParam }) => getMyFeedback(pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

/**
 * 운영자: 문의 목록 (무한 스크롤)
 */
export const useAdminFeedbackInfiniteQuery = (
  params: GetAdminFeedbackParams,
  options?: { enabled?: boolean },
) => {
  return useInfiniteQuery({
    queryKey: feedbackKeys.admin(params).queryKey,
    queryFn: ({ pageParam }) =>
      getAdminFeedback({ ...params, cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: options?.enabled,
  });
};
