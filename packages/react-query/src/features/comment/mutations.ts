"use client";
import {
  createComment,
  deleteComment,
  toggleCommentLike,
  updateComment,
} from "@bookjeok/api-client";
import {
  Comment,
  commentKeys,
  CommentTargetType,
  CreateCommentParams,
  UpdateCommentParams,
} from "@bookjeok/core";
import {
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

/**
 * 댓글이 추가·수정·삭제되면 해당 타겟의 댓글 목록 전체를 무효화합니다.
 *
 * 페이지 번호까지 키에 넣어 특정 페이지만 무효화하면, 목록이 한 칸씩 밀리면서
 * 나머지 페이지가 낡은 채로 남습니다. 페이지 번호를 뺀 접두사로 매칭해
 * 그 타겟의 모든 페이지를 한 번에 갱신합니다.
 */
const invalidateCommentList = (
  queryClient: QueryClient,
  targetType: CommentTargetType,
  targetId: string,
) => {
  queryClient.invalidateQueries({
    queryKey: [...commentKeys.list._def, targetType, targetId],
  });
};

/**
 * 댓글 생성 뮤테이션 훅
 */
export const useCreateCommentMutation = (
  targetType: CommentTargetType,
  targetId: string,
  options?: {
    onSuccess?: (data: Comment) => void;
    onError?: (error: unknown) => void;
  },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      content,
      idempotencyKey,
    }: {
      content: string;
      idempotencyKey?: string;
    }) => createComment({ content, targetType, targetId }, { idempotencyKey }),
    onSuccess: (data) => {
      invalidateCommentList(queryClient, targetType, targetId);
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

/**
 * 댓글 수정 뮤테이션 훅
 */
export const useUpdateCommentMutation = (
  targetType: CommentTargetType,
  targetId: string,
  options?: {
    onSuccess?: (data: Comment) => void;
    onError?: (error: unknown) => void;
  },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      updateComment(id, { content }),
    onSuccess: (data) => {
      invalidateCommentList(queryClient, targetType, targetId);
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

/**
 * 댓글 삭제 뮤테이션 훅
 */
export const useDeleteCommentMutation = (
  targetType: CommentTargetType,
  targetId: string,
  options?: { onSuccess?: () => void; onError?: (error: unknown) => void },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteComment(id),
    onSuccess: () => {
      invalidateCommentList(queryClient, targetType, targetId);
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

/**
 * 댓글 좋아요 토글 뮤테이션 훅 (낙관적 업데이트)
 */
export const useToggleCommentLikeMutation = (
  targetType: CommentTargetType,
  targetId: string,
  page: number,
  options?: {
    viewerId?: number;
    onError?: (error: unknown) => void;
  },
) => {
  const queryClient = useQueryClient();
  const queryKey = commentKeys.list(
    targetType,
    targetId,
    page,
    options?.viewerId,
  ).queryKey;

  return useMutation({
    mutationFn: (id: number) => toggleCommentLike(id),
    onMutate: async (commentId: number) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(
        queryKey,
        (old: { data: Comment[]; meta: unknown } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((comment) =>
              comment.id === commentId
                ? {
                    ...comment,
                    isLiked: !comment.isLiked,
                    likeCount: comment.isLiked
                      ? comment.likeCount - 1
                      : comment.likeCount + 1,
                  }
                : comment,
            ),
          };
        },
      );

      return { previousData };
    },
    onSuccess: (updatedComment) => {
      queryClient.setQueryData(
        queryKey,
        (old: { data: Comment[]; meta: unknown } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((comment) =>
              comment.id === updatedComment.id
                ? {
                    ...comment,
                    isLiked: updatedComment.isLiked,
                    likeCount: updatedComment.likeCount,
                  }
                : comment,
            ),
          };
        },
      );
    },
    onError: (err, commentId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      options?.onError?.(err);
    },
  });
};

/**
 * 내 댓글 삭제 뮤테이션 훅 (마이페이지용)
 */
export const useDeleteMyCommentMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.my.queryKey,
      });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};
