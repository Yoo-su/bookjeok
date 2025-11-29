import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  deleteReview,
  getReview,
  getReviewFeeds,
  getReviews,
} from "@/features/review/apis";
import { GetReviewsParams, GetReviewsResponse } from "@/features/review/types";
import { QUERY_KEYS } from "@/shared/constants/query-keys";

export const useReviewsQuery = (params: GetReviewsParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.reviewKeys.list(params).queryKey,
    queryFn: () => getReviews(params),
    enabled: params.enabled !== false,
  });
};

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

export const useReviewFeedsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.reviewKeys.feeds.queryKey,
    queryFn: getReviewFeeds,
    enabled,
  });
};

export const useReviewDetailQuery = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.reviewKeys.detail(id).queryKey,
    queryFn: () => getReview(id),
    enabled,
  });
};

export const useDeleteReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reviewKeys.all.queryKey,
      });
    },
  });
};
