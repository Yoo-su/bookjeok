"use client";

import Link from "next/link";
import { useState } from "react";

import { useAuthStore } from "@/features/auth/store";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Button } from "@/shared/components/shadcn/button";
import { Textarea } from "@/shared/components/shadcn/textarea";
import { cn } from "@/shared/utils";

import { MAX_COMMENT_LENGTH } from "../../constants";
import { useCreateCommentMutation } from "../../mutations";
import { CommentTargetType } from "../../types";

interface CommentFormProps {
  targetType: CommentTargetType;
  targetId: string;
}

/**
 * 댓글 작성 폼
 */
export const CommentForm = ({ targetType, targetId }: CommentFormProps) => {
  const [content, setContent] = useState("");
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = !!user;
  const { mutate: createComment, isPending } = useCreateCommentMutation(
    targetType,
    targetId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPending) return;

    createComment(content.trim(), {
      onSuccess: () => setContent(""),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-muted/30 rounded-xl p-6 text-center mb-8">
        <p className="text-muted-foreground">
          댓글을 작성하려면{" "}
          <Link
            href="/login"
            className="text-primary underline hover:no-underline"
          >
            로그인
          </Link>
          이 필요합니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm">
        <div className="flex gap-3">
          {/* 사용자 아바타 */}
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage
              src={user?.profileImageUrl || ""}
              alt={user?.nickname}
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.nickname?.slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          {/* 입력 영역 */}
          <div className="flex-1 space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="댓글을 작성해주세요..."
              maxLength={MAX_COMMENT_LENGTH}
              className={cn(
                "min-h-[80px] resize-none bg-background/50",
                "border-border/50 focus:border-primary/50",
                "placeholder:text-muted-foreground/50"
              )}
            />

            {/* 하단 액션 바 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {content.length} / {MAX_COMMENT_LENGTH}자
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={!content.trim() || isPending}
                className="px-6"
              >
                {isPending ? "작성 중..." : "작성"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
