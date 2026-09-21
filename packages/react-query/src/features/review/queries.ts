"use client";
import {
  getMyReviewReaction,
  getPopularReviews,
  getRecommendedReviews,
  getReview,
  getReviewFeeds,
  getReviewForEdit,
  getReviews,
  getTagSuggestions,
} from "@bookjeok/api-client";
import {
  CACHE_TIME,
  GetReviewsParams,
  GetReviewsResponse,
  Review,
  reviewKeys,
  TagSuggestion,
} from "@bookjeok/core";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

/**
 * 리뷰 목록 조회
 */
export const useReviewsQuery = (
  params: GetReviewsParams,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: reviewKeys.list(params).queryKey,
    queryFn: () => getReviews(params),
    enabled,
  });
};

/**
 * 리뷰 목록 무한 스크롤 조회
 */
export const useReviewsInfiniteQuery = (
  params: GetReviewsParams,
  enabled: boolean = true,
) => {
  return useInfiniteQuery({
    queryKey: reviewKeys.list(params).queryKey,
    queryFn: ({ pageParam }) =>
      getReviews({
        ...params,
        cursorId: pageParam as number | undefined,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage: GetReviewsResponse) => {
      return lastPage.nextCursor ?? undefined;
    },
    enabled,
  });
};

/**
 * 리뷰 피드 조회
 */
export const useReviewFeedsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: reviewKeys.feeds().queryKey,
    queryFn: () => getReviewFeeds(),
    enabled,
  });
};

/**
 * 태그 자동완성 후보 조회
 *
 * 입력 한 글자마다 요청이 나가지 않도록 호출부에서 디바운스한 값을 넘깁니다.
 * 같은 문자열은 쿼리 키가 같아 캐시에서 바로 나옵니다.
 */
export const useTagSuggestionsQuery = (q: string, enabled: boolean = true) => {
  return useQuery<TagSuggestion[]>({
    queryKey: reviewKeys.tagSuggestions(q).queryKey,
    queryFn: () => getTagSuggestions({ q }),
    enabled,
    staleTime: CACHE_TIME.FIVE_MINUTES,
  });
};

/**
 * 인기 리뷰 조회
 */
export const usePopularReviewsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: reviewKeys.popular.queryKey,
    queryFn: () => getPopularReviews(),
    enabled,
  });
};

/**
 * 리뷰 상세 조회
 */
export const useReviewDetailQuery = (id: number) => {
  return useQuery({
    queryKey: reviewKeys.detail(id).queryKey,
    queryFn: () => getReview(id),
  });
};

/**
 * 수정용 리뷰 조회 (본인 리뷰만 조회 가능)
 */
export const useReviewForEditQuery = (id: number) => {
  return useQuery({
    queryKey: reviewKeys.forEdit(id).queryKey,
    queryFn: () => getReviewForEdit(id),
    enabled: !!id,
    retry: false,
  });
};

/**
 * 나의 리액션 조회
 */
export const useMyReviewReactionQuery = (
  id: number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: [...reviewKeys.detail(id).queryKey, "reaction"],
    queryFn: () => getMyReviewReaction(id),
    enabled,
    staleTime: CACHE_TIME.THIRTY_SECONDS,
  });
};

/**
 * 추천 리뷰 조회
 */
export const useRecommendedReviewsQuery = (
  id: number,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: reviewKeys.recommend(id).queryKey,
    queryFn: () => getRecommendedReviews(id),
    enabled,
  });
};
