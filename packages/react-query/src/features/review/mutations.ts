"use client";
import {
  createReview,
  deleteReview,
  toggleReviewReaction,
  updateReview,
} from "@bookjeok/api-client";
import {
  Review,
  ReviewFormValues,
  reviewKeys,
  reviewMutationKeys,
  ReviewReactionType,
} from "@bookjeok/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 리뷰 리액션을 토글하는 뮤테이션 훅입니다.
 */
export const useToggleReviewReactionMutation = (
  reviewId: number,
  options?: {
    onSuccess?: (data: Review) => void;
    onError?: (error: unknown) => void;
  },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: reviewMutationKeys.toggleReaction(reviewId),
    mutationFn: (type: ReviewReactionType) =>
      toggleReviewReaction(reviewId, type),
    onMutate: async (type) => {
      await queryClient.cancelQueries({
        queryKey: reviewKeys.detail(reviewId).queryKey,
      });
      await queryClient.cancelQueries({
        queryKey: [...reviewKeys.detail(reviewId).queryKey, "reaction"],
      });

      const previousReview = queryClient.getQueryData<Review>(
        reviewKeys.detail(reviewId).queryKey,
      );
      const previousMyReaction =
        queryClient.getQueryData<ReviewReactionType | null>([
          ...reviewKeys.detail(reviewId).queryKey,
          "reaction",
        ]);

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

        if (previousMyReaction) {
          newReactionCounts[previousMyReaction] = Math.max(
            0,
            newReactionCounts[previousMyReaction] - 1,
          );
        }

        if (newMyReaction) {
          newReactionCounts[newMyReaction] =
            (newReactionCounts[newMyReaction] || 0) + 1;
        }

        queryClient.setQueryData(reviewKeys.detail(reviewId).queryKey, {
          ...previousReview,
          reactionCounts: newReactionCounts,
        });
        queryClient.setQueryData(
          [...reviewKeys.detail(reviewId).queryKey, "reaction"],
          newMyReaction,
        );
      }

      return { previousReview, previousMyReaction };
    },
    onError: (err, _newReaction, context) => {
      if (context?.previousReview) {
        queryClient.setQueryData(
          reviewKeys.detail(reviewId).queryKey,
          context.previousReview,
        );
      }
      if (context?.previousMyReaction !== undefined) {
        queryClient.setQueryData(
          [...reviewKeys.detail(reviewId).queryKey, "reaction"],
          context.previousMyReaction,
        );
      }
      options?.onError?.(err);
    },
    onSuccess: (data) => {
      // 낙관적 값은 캐시가 낡았거나 다른 사용자의 반응이 겹치면 어긋난다.
      // 응답 전체를 덮지 않는 이유: 비공개 리뷰는 서버가 본문을 가린 채 돌려주므로
      // 작성자 본인 화면의 원문이 마스킹으로 바뀐다.
      if (data?.reactionCounts) {
        queryClient.setQueryData<Review>(
          reviewKeys.detail(reviewId).queryKey,
          (old) =>
            old ? { ...old, reactionCounts: data.reactionCounts } : old,
        );
      }
      options?.onSuccess?.(data);
    },
  });
};

/**
 * 리뷰를 생성하는 뮤테이션 훅입니다.
 */
export const useCreateReviewMutation = (options?: {
  onSuccess?: () => void;
}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idempotencyKey,
      ...data
    }: ReviewFormValues & { idempotencyKey?: string }) =>
      createReview(data as ReviewFormValues, { idempotencyKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.list._def,
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.feeds().queryKey,
      });
      options?.onSuccess?.();
    },
  });
};

/**
 * 리뷰를 수정하는 뮤테이션 훅입니다.
 */
export const useUpdateReviewMutation = (options?: {
  onSuccess?: (data: Review) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReviewFormValues }) =>
      updateReview(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(data.id).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.list._def,
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.feeds().queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.popular.queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.recommend(data.id).queryKey,
      });

      options?.onSuccess?.(data);
    },
  });
};

/**
 * 리뷰를 삭제하는 뮤테이션 훅입니다.
 */
export const useDeleteReviewMutation = (options?: {
  onSuccess?: (id: number) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteReview(id),
    onSuccess: (_data, id) => {
      // 삭제된 리뷰의 상세 캐시는 무효화가 아니라 폐기한다.
      // 남겨두면 목록에서 이미 사라진 글을 캐시로 다시 그릴 수 있다.
      queryClient.removeQueries({
        queryKey: reviewKeys.detail(id).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.list._def,
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.feeds().queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.popular.queryKey,
      });
      options?.onSuccess?.(id);
    },
  });
};
