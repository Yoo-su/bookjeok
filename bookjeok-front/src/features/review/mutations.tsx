"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteImages } from "@/features/book/actions/delete-action";
import {
  createReview,
  deleteReview,
  toggleReviewReaction,
  updateReview,
} from "@/features/review/apis";
import {
  Review,
  ReviewFormValues,
  ReviewReactionType,
} from "@/features/review/types";
import { QUERY_KEYS } from "@/shared/constants/query-keys";

/**
 * 리뷰 리액션을 토글하는 뮤테이션 훅입니다.
 * 낙관적 업데이트를 지원합니다.
 */
export const useToggleReviewReactionMutation = (reviewId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (type: ReviewReactionType) =>
      toggleReviewReaction(reviewId, type),
    onMutate: async (type) => {
      // 진행 중인 모든 리패치 취소
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.reviewKeys.detail(reviewId).queryKey,
      });
      await queryClient.cancelQueries({
        queryKey: [
          ...QUERY_KEYS.reviewKeys.detail(reviewId).queryKey,
          "reaction",
        ],
      });

      // 이전 값 스냅샷 저장
      const previousReview = queryClient.getQueryData<Review>(
        QUERY_KEYS.reviewKeys.detail(reviewId).queryKey
      );
      const previousMyReaction =
        queryClient.getQueryData<ReviewReactionType | null>([
          ...QUERY_KEYS.reviewKeys.detail(reviewId).queryKey,
          "reaction",
        ]);

      // 새로운 값으로 낙관적 업데이트
      if (previousReview) {
        const isSameReaction = previousMyReaction === type;
        const newMyReaction = isSameReaction ? null : type;

        const newReactionCounts = {
          ...(previousReview.reactionCounts || {
            [ReviewReactionType.LIKE]: 0,
            [ReviewReactionType.INSIGHTFUL]: 0,
            [ReviewReactionType.SUPPORT]: 0,
          }),
        };

        // 기존 리액션이 있다면 카운트 감소
        if (previousMyReaction) {
          newReactionCounts[previousMyReaction] = Math.max(
            0,
            newReactionCounts[previousMyReaction] - 1
          );
        }

        // 새로운 리액션이 추가되었다면 카운트 증가
        if (newMyReaction) {
          newReactionCounts[newMyReaction] =
            (newReactionCounts[newMyReaction] || 0) + 1;
        }

        queryClient.setQueryData(
          QUERY_KEYS.reviewKeys.detail(reviewId).queryKey,
          {
            ...previousReview,
            reactionCounts: newReactionCounts,
          }
        );
        queryClient.setQueryData(
          [...QUERY_KEYS.reviewKeys.detail(reviewId).queryKey, "reaction"],
          newMyReaction
        );
      }

      return { previousReview, previousMyReaction };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousReview) {
        queryClient.setQueryData(
          QUERY_KEYS.reviewKeys.detail(reviewId).queryKey,
          context.previousReview
        );
      }
      if (context?.previousMyReaction !== undefined) {
        queryClient.setQueryData(
          [...QUERY_KEYS.reviewKeys.detail(reviewId).queryKey, "reaction"],
          context.previousMyReaction
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reviewKeys.detail(reviewId).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: [
          ...QUERY_KEYS.reviewKeys.detail(reviewId).queryKey,
          "reaction",
        ],
      });
    },
  });
};

/**
 * 리뷰를 생성하는 뮤테이션 훅입니다.
 */
export const useCreateReviewMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReviewFormValues) => createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reviewKeys.feeds.queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reviewKeys.list._def,
      });
      toast.success("리뷰가 작성되었습니다.");
    },
    onError: () => {
      toast.error("리뷰 작성 중 오류가 발생했습니다.");
    },
  });
};

/**
 * 리뷰를 수정하는 뮤테이션 훅입니다.
 */
export const useUpdateReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      deletedImageUrls,
    }: {
      id: number;
      data: ReviewFormValues;
      deletedImageUrls?: string[];
    }) => {
      if (deletedImageUrls && deletedImageUrls.length > 0) {
        await deleteImages(deletedImageUrls);
      }
      return updateReview(id, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reviewKeys.detail(data.id).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reviewKeys.feeds.queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reviewKeys.list._def,
      });
      toast.success("리뷰가 수정되었습니다!");
    },
    onError: (error: any) => {
      toast.error(error.message || "리뷰 수정 중 오류가 발생했습니다.");
    },
  });
};

/**
 * 리뷰를 삭제하는 뮤테이션 훅입니다.
 */
export const useDeleteReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reviewKeys.feeds.queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reviewKeys.list._def,
      });
      toast.success("리뷰가 삭제되었습니다.");
    },
    onError: () => {
      toast.error("리뷰 삭제 중 오류가 발생했습니다.");
    },
  });
};
