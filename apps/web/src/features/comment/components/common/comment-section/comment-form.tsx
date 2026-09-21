"use client";

import { CommentTargetType, MAX_COMMENT_LENGTH } from "@bookjeok/core";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { saveReturnUrl } from "@/features/auth/utils/return-url";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Button } from "@/shared/components/shadcn/button";
import { Spinner } from "@/shared/components/shadcn/spinner";
import { Textarea } from "@/shared/components/shadcn/textarea";
import { Link, usePathname } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { useSafeSubmit } from "@/shared/hooks/use-safe-submit";
import { cn } from "@/shared/utils";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import { useCreateCommentMutation } from "../../../mutations";

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
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { mutateAsync: createCommentAsync, isPending } =
    useCreateCommentMutation(targetType, targetId);
  const t = useTranslations("comment.form");

  const { executeSafeSubmit } = useSafeSubmit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPending) return;

    executeSafeSubmit(async (idempotencyKey) => {
      await createCommentAsync({ content: content.trim(), idempotencyKey });
      setContent("");
    });
  };

  if (!mounted) {
    return (
      <div className="w-full p-4 sm:p-5 mb-8 bg-white dark:bg-stone-900/40 rounded-[32px] rounded-tr-[10px] border border-stone-100 dark:border-stone-800/60 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800" />
          <div className="w-24 h-4 bg-stone-100 dark:bg-stone-800 rounded" />
        </div>
        <div className="pl-11 pr-2">
          <div className="h-12 bg-stone-50 dark:bg-stone-900/60 rounded-2xl mb-4" />
          <div className="flex justify-between items-center border-t border-stone-100/60 dark:border-stone-800/60 pt-3">
            <div className="w-16 h-3 bg-stone-100 dark:bg-stone-800 rounded" />
            <div className="w-20 h-8 bg-stone-200 dark:bg-stone-700 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const isAuthenticated = !!user;

  if (!isAuthenticated) {
    return (
      <div className="bg-muted/30 rounded-xl p-6 text-center mb-8">
        <p className="text-muted-foreground">
          {t.rich("login_guide", {
            link: (chunks) => (
              <Link
                href={PATHS.LOGIN}
                onClick={() => saveReturnUrl(pathname)}
                className="text-primary underline hover:no-underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div
        className={cn(
          "relative w-full p-4 sm:p-5",
          "bg-white dark:bg-stone-900/40",
          "rounded-[32px] rounded-tr-[10px]", // 몽실몽실한 구름 형태의 작성 폼 (꼬리 우상단)
          "border border-stone-100 dark:border-stone-800/60",
          "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] focus-within:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] focus-within:border-stone-200",
          "transition-all duration-300",
        )}
      >
        {/* 헤더: 사용자 정보 */}
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="w-8 h-8 shrink-0 ring-1 ring-stone-200">
            <AvatarImage
              src={getProfileImageUrl(user?.profileImageUrl)}
              alt={user?.nickname}
            />
            <AvatarFallback className="bg-stone-100 text-stone-500 font-medium">
              {user?.nickname?.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="font-serif font-medium text-[15px] tracking-tight text-stone-900">
            {user?.nickname}
          </span>
        </div>

        {/* 입력 및 액션 영역 - 아바타 우측 라인에 정렬 */}
        <div className="pl-11 pr-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            maxLength={MAX_COMMENT_LENGTH}
            className={cn(
              "min-h-[50px] resize-none bg-transparent border-0 focus-visible:ring-0 p-0",
              "text-base leading-[1.7] md:text-[14px] text-stone-900 font-light",
              "placeholder:text-stone-300",
            )}
          />

          {/* 하단 액션 바 */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100/60">
            <span className="text-[11px] text-stone-400 font-light tabular-nums">
              {t("length_limit", {
                current: content.length,
                max: MAX_COMMENT_LENGTH,
              })}
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || isPending}
              className={cn(
                "h-8 text-[12px] px-5 rounded-full font-medium transition-all duration-300",
                content.trim()
                  ? "bg-stone-900 text-white hover:bg-stone-800 shadow-md shadow-stone-900/10"
                  : "bg-stone-100 text-stone-400 cursor-not-allowed",
              )}
            >
              {isPending ? <Spinner className="w-4 h-4" /> : t("submit")}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
