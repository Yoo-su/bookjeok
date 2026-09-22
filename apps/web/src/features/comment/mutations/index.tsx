"use client";

import { CommentTargetType } from "@bookjeok/core";
import {
  useCreateCommentMutation as useSharedCreateCommentMutation,
  useDeleteCommentMutation as useSharedDeleteCommentMutation,
  useDeleteMyCommentMutation as useSharedDeleteMyCommentMutation,
  useToggleCommentLikeMutation as useSharedToggleCommentLikeMutation,
  useUpdateCommentMutation as useSharedUpdateCommentMutation,
} from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

/**
 * 댓글 생성 뮤테이션 훅
 */
export const useCreateCommentMutation = (
  targetType: CommentTargetType,
  targetId: string,
) => {
  const t = useTranslations("comment.toast");

  return useSharedCreateCommentMutation(targetType, targetId, {
    onSuccess: () => {
      toast.success(t("create_success"));
    },
    onError: () => {
      toast.error(t("create_error"));
    },
  });
};

/**
 * 댓글 수정 뮤테이션 훅
 */
export const useUpdateCommentMutation = (
  targetType: CommentTargetType,
  targetId: string,
) => {
  const t = useTranslations("comment.toast");

  return useSharedUpdateCommentMutation(targetType, targetId, {
    onSuccess: () => {
      toast.success(t("update_success"));
    },
    onError: () => {
      toast.error(t("update_error"));
    },
  });
};

/**
 * 댓글 삭제 뮤테이션 훅
 */
export const useDeleteCommentMutation = (
  targetType: CommentTargetType,
  targetId: string,
) => {
  const t = useTranslations("comment.toast");

  return useSharedDeleteCommentMutation(targetType, targetId, {
    onSuccess: () => {
      toast.success(t("delete_success"));
    },
    onError: () => {
      toast.error(t("delete_error"));
    },
  });
};

/**
 * 댓글 좋아요 토글 뮤테이션 훅 (낙관적 업데이트)
 */
export const useToggleCommentLikeMutation = (
  targetType: CommentTargetType,
  targetId: string,
  page: number,
  viewerId?: number,
) => {
  const t = useTranslations("comment.toast");

  return useSharedToggleCommentLikeMutation(targetType, targetId, page, {
    viewerId,
    onError: () => {
      toast.error(t("like_error"));
    },
  });
};

/**
 * 내 댓글 삭제 뮤테이션 훅 (마이페이지용)
 */
export const useDeleteMyCommentMutation = () => {
  const t = useTranslations("comment.toast");

  return useSharedDeleteMyCommentMutation({
    onSuccess: () => {
      toast.success(t("delete_success"));
    },
    onError: () => {
      toast.error(t("delete_error"));
    },
  });
};
