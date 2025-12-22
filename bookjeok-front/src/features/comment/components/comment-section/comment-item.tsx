"use client";

import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Heart, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { useAuthStore } from "@/features/auth/store";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Button } from "@/shared/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/shadcn/dropdown-menu";
import { Textarea } from "@/shared/components/shadcn/textarea";
import { cn } from "@/shared/utils";

import { COMMENT_LINE_CLAMP, MAX_COMMENT_LENGTH } from "../../constants";
import {
  useDeleteCommentMutation,
  useToggleCommentLikeMutation,
  useUpdateCommentMutation,
} from "../../mutations";
import { Comment, CommentTargetType } from "../../types";

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

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = !!user;
  const isOwner = user?.id === comment.userId;

  const { mutate: toggleLike, isPending: isLikePending } =
    useToggleCommentLikeMutation(targetType, targetId, page);
  const { mutate: updateComment, isPending: isUpdatePending } =
    useUpdateCommentMutation(targetType, targetId, page);
  const { mutate: deleteComment, isPending: isDeletePending } =
    useDeleteCommentMutation(targetType, targetId, page);

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: ko,
  });

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
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleDelete = () => {
    if (isDeletePending) return;
    if (window.confirm("정말 삭제하시겠습니까?")) {
      deleteComment(comment.id);
    }
  };

  return (
    <div className="flex gap-3 group">
      {/* 아바타 */}
      <Avatar
        className={cn(
          "w-9 h-9 shrink-0 ring-2 ring-background shadow-sm",
          isOwner && "ring-primary/20"
        )}
      >
        <AvatarImage
          src={comment.user.profileImageUrl || ""}
          alt={comment.user.nickname}
        />
        <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/5 text-primary text-xs font-medium">
          {comment.user.nickname.slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      {/* 말풍선 */}
      <div className="flex-1 min-w-0">
        {/* 구름 스타일 말풍선 */}
        <div
          className={cn(
            "relative px-4 py-3 rounded-2xl rounded-tl-sm",
            "shadow-[0_2px_12px_rgba(0,0,0,0.04)]",
            "backdrop-blur-sm",
            "transition-all duration-200",
            "hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]",
            "bg-linear-to-br from-white/80 to-white/60 dark:from-white/10 dark:to-white/5"
          )}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-medium text-sm truncate">
                {comment.user.nickname}
              </span>
              {isOwner && (
                <span className="shrink-0 text-[10px] text-primary/70 font-medium">
                  · 나
                </span>
              )}
              <span className="shrink-0 text-[11px] text-muted-foreground/60">
                · {timeAgo}
              </span>
            </div>

            {/* 드롭다운 메뉴 */}
            {isOwner && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                  >
                    <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[100px]">
                  <DropdownMenuItem
                    onClick={() => setIsEditing(true)}
                    disabled={isDeletePending}
                    className="text-xs"
                  >
                    <Pencil className="h-3 w-3 mr-1.5" />
                    수정
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeletePending}
                    className="text-xs text-destructive focus:text-destructive"
                  >
                    {isDeletePending ? (
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3 mr-1.5" />
                    )}
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* 본문 */}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={MAX_COMMENT_LENGTH}
                className="min-h-[60px] resize-none text-sm bg-background/50"
              />
              <div className="flex gap-1.5 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleUpdate}
                  disabled={!editContent.trim() || isUpdatePending}
                >
                  {isUpdatePending ? "저장 중..." : "저장"}
                </Button>
              </div>
            </div>
          ) : (
            <p
              className={cn(
                "text-[13px] leading-relaxed text-foreground/85 whitespace-pre-wrap break-all",
                !isExpanded && isLongComment && "line-clamp-3"
              )}
            >
              {comment.content}
            </p>
          )}

          {/* 더 보기 버튼 */}
          {!isEditing && isLongComment && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] text-primary/70 hover:text-primary transition-colors mt-1"
            >
              {isExpanded ? "접기" : "더 보기"}
            </button>
          )}
        </div>

        {/* 액션 바 (말풍선 외부) */}
        {!isEditing && (
          <div className="flex items-center gap-3 mt-1.5 ml-1">
            <button
              onClick={handleLike}
              disabled={!isAuthenticated || isLikePending}
              className={cn(
                "flex items-center gap-1 text-[11px] transition-all",
                comment.isLiked
                  ? "text-rose-500"
                  : "text-muted-foreground/50 hover:text-rose-400",
                !isAuthenticated && "cursor-not-allowed",
                isLikePending && "opacity-50 pointer-events-none"
              )}
            >
              {isLikePending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Heart
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    comment.isLiked && "fill-current scale-110"
                  )}
                />
              )}
              {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
