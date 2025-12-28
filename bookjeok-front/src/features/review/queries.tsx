import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  getMyReviewReaction,
  getPopularReviews,
  getReview,
  getReviewFeeds,
  getReviews,
} from "@/features/review/apis";
import {
  GetReviewsParams,
  GetReviewsResponse,
  Review,
} from "@/features/review/types";
import { QUERY_KEYS } from "@/shared/constants/query-keys";

/**
 * 리뷰 목록 조회
 */
export const useReviewsQuery = (params: GetReviewsParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.reviewKeys.list(params).queryKey,
    queryFn: () => getReviews(params),
    enabled: params.enabled !== false,
  });
};

/**
 * 리뷰 목록 무한 스크롤 조회
 */
export const useReviewsInfiniteQuery = (params: GetReviewsParams) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.reviewKeys.list(params).queryKey,
    queryFn: ({ pageParam = 1 }) => getReviews({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetReviewsResponse) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: params.enabled !== false,
  });
};

/**
 * 리뷰 피드 조회
 */
export const useReviewFeedsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.reviewKeys.feeds.queryKey,
    queryFn: getReviewFeeds,
    enabled,
  });
};

/**
 * 인기 리뷰 조회
 */
export const usePopularReviewsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.reviewKeys.popular.queryKey,
    queryFn: getPopularReviews,
    enabled,
  });
};

/**
 * 리뷰 상세 조회
 */
export const useReviewDetailQuery = (
  id: number,
  enabled: boolean = true,
  initialData?: Review
) => {
  return useQuery({
    queryKey: QUERY_KEYS.reviewKeys.detail(id).queryKey,
    queryFn: () => getReview(id),
    enabled,
    initialData,
  });
};

/**
 * 나의 리액션 조회 (내 데이터 - 짧은 staleTime)
 */
export const useMyReviewReactionQuery = (
  id: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.reviewKeys.detail(id).queryKey, "reaction"],
    queryFn: () => getMyReviewReaction(id),
    enabled,
    staleTime: 30 * 1000,
  });
};
