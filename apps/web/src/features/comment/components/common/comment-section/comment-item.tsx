"use client";

import { Comment, CommentTargetType, MAX_COMMENT_LENGTH } from "@bookjeok/core";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { useConfirm } from "@/features/confirm";
import { AnimatedHeart } from "@/shared/components/icons/animated";
import {
  Heart,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/shadcn/dropdown-menu";
import { Textarea } from "@/shared/components/shadcn/textarea";
import { UserAvatarMenu } from "@/shared/components/ui/user-avatar-menu";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils";
import { formatRelativeTime } from "@/shared/utils/format-date";

import { COMMENT_LINE_CLAMP } from "../../../constants/config";
import {
  useDeleteCommentMutation,
  useToggleCommentLikeMutation,
  useUpdateCommentMutation,
} from "../../../mutations";

interface CommentItemProps {
  comment: Comment;
  targetType: CommentTargetType;
  targetId: string;
  page: number;
}

/**
 * 개별 댓글 카드 - 구름 스타일
 * 부드럽고 가벼운 느낌의 미니멀한 디자인
 */
export const CommentItem = ({
  comment,
  targetType,
  targetId,
  page,
}: CommentItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const t = useTranslations("comment.item");
  const tAria = useTranslations("common.aria");
  const locale = useLocale();

  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const currentUser = mounted ? user : null;
  const isAuthenticated = !!currentUser;
  const isOwner = currentUser?.id === comment.userId;

  const { mutate: toggleLike, isPending: isLikePending } =
    useToggleCommentLikeMutation(targetType, targetId, page, user?.id);
  const { mutate: updateComment, isPending: isUpdatePending } =
    useUpdateCommentMutation(targetType, targetId);
  const { mutate: deleteComment, isPending: isDeletePending } =
    useDeleteCommentMutation(targetType, targetId);
  const confirm = useConfirm();

  const handleDeleteComment = async () => {
    const isConfirmed = await confirm({
      title: t("delete_confirm.title"),
      description: t("delete_confirm.desc"),
      confirmText: t("delete"),
      cancelText: t("cancel"),
      variant: "destructive",
    });

    if (isConfirmed) {
      deleteComment(comment.id);
    }
  };

  const timeAgo = formatRelativeTime(comment.createdAt, locale);

  const isLongComment =
    comment.content.split("\n").length > COMMENT_LINE_CLAMP ||
    comment.content.length > 150;

  const handleLike = () => {
    if (!isAuthenticated || isLikePending) return;
    toggleLike(comment.id);
  };

  const handleUpdate = () => {
    if (!editContent.trim() || isUpdatePending) return;
    updateComment(
      { id: comment.id, content: editContent.trim() },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  return (
    <div
      className={cn(
        "group relative w-full p-4 sm:p-5 mb-4",
        "bg-white dark:bg-stone-900/40",
        "rounded-[32px] rounded-tl-[10px]", // 몽실몽실한 구름 형태의 말풍선
        "border border-stone-100 dark:border-stone-800/60",
        "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]",
        "transition-all duration-300",
      )}
    >
      {/* 헤더: 아바타 & 닉네임 & 메뉴 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <UserAvatarMenu
            user={comment.user}
            showNickname={false}
            size="sm"
            tooltipSide="bottom"
            tooltipAlign="start"
            className={cn(
              "shrink-0",
              isOwner && "ring-1 ring-stone-200 rounded-full",
            )}
          />
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              {comment.user?.handle ? (
                <Link
                  href={PATHS.USER_PROFILE(comment.user.handle)}
                  className="font-serif font-medium text-[15px] tracking-tight text-stone-900 dark:text-stone-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                  {comment.user.nickname}
                </Link>
              ) : (
                <span className="font-serif font-medium text-[15px] tracking-tight text-stone-900 dark:text-stone-100">
                  {comment.user.nickname}
                </span>
              )}
              {isOwner && (
                <span className="shrink-0 text-[10px] text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded-[4px] font-medium border border-stone-200">
                  {t("me")}
                </span>
              )}
            </div>
            <span className="text-[11px] text-stone-400 font-light mt-0.5 tabular-nums tracking-wide">
              {timeAgo}
            </span>
          </div>
        </div>

        {/* 드롭다운 메뉴 */}
        {isOwner && !isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-300 rounded-full hover:bg-stone-100 text-stone-400"
                aria-label={tAria("more_options")}
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[100px]">
              <DropdownMenuItem
                onClick={() => setIsEditing(true)}
                disabled={isDeletePending}
                className="text-xs"
              >
                <Pencil className="h-3 w-3 mr-1.5" />
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteComment}
                disabled={isDeletePending}
                className="text-xs text-destructive focus:text-destructive"
              >
                {isDeletePending ? (
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-1.5" />
                )}
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* 본문 & 액션 영역 - 아바타 우측 정렬선에 맞춤 */}
      <div className="pl-11 pr-2">
        {isEditing ? (
          <div className="space-y-3 mt-1">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={MAX_COMMENT_LENGTH}
              className="min-h-[80px] resize-none text-base md:text-[14px] bg-stone-50 border-stone-200 focus-visible:ring-stone-900 rounded-[16px] px-4 py-3"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[12px] px-4 rounded-full border-stone-200 hover:bg-stone-100 hover:text-stone-900 text-stone-500 font-medium"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
              >
                {t("cancel")}
              </Button>
              <Button
                size="sm"
                className="h-8 text-[12px] px-5 rounded-full bg-stone-900 text-white hover:bg-stone-800 transition-colors font-medium shadow-md shadow-stone-900/10"
                onClick={handleUpdate}
                disabled={!editContent.trim() || isUpdatePending}
              >
                {isUpdatePending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  t("save")
                )}
              </Button>
            </div>
          </div>
        ) : (
          <p
            className={cn(
              "text-[14px] leading-[1.7] text-stone-700 font-light whitespace-pre-wrap wrap-break-word",
              !isExpanded && isLongComment && "line-clamp-3",
            )}
          >
            {comment.content}
          </p>
        )}

        {/* 더 보기 버튼 */}
        {!isEditing && isLongComment && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            className="text-[12px] text-stone-400 hover:text-stone-900 transition-colors mt-2 font-medium underline underline-offset-4 decoration-stone-200 hover:decoration-stone-400 cursor-pointer"
          >
            {isExpanded ? t("fold") : t("more")}
          </button>
        )}
        {/* 액션 바 */}
        {!isEditing && (
          <div className="flex items-center gap-4 mt-3 pb-1">
            <button
              type="button"
              onClick={handleLike}
              disabled={!isAuthenticated || isLikePending}
              aria-label={comment.isLiked ? tAria("unlike") : tAria("like")}
              aria-pressed={comment.isLiked}
              className={cn(
                "group/like flex items-center gap-2 text-[12px] transition-all duration-300 outline-hidden cursor-pointer",
                comment.isLiked
                  ? "text-stone-900 font-medium"
                  : "text-stone-400 hover:text-stone-900",
                !isAuthenticated && "cursor-not-allowed opacity-50",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center p-1.5 rounded-[12px] transition-all duration-300",
                  comment.isLiked
                    ? "bg-stone-900 text-white shadow-sm"
                    : "bg-stone-50 text-stone-400 group-hover/like:bg-stone-100",
                )}
              >
                <AnimatedHeart
                  size={14}
                  animate={comment.isLiked}
                  animateOnHover
                  className={cn(
                    "transition-colors duration-200",
                    comment.isLiked && "fill-current",
                  )}
                  aria-hidden="true"
                />
              </div>
              {comment.likeCount > 0 && (
                <span className="tabular-nums tracking-wide">
                  {comment.likeCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
