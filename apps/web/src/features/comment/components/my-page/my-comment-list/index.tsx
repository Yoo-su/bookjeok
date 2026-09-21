"use client";

import { CommentTargetType } from "@bookjeok/core";
import { useMyCommentsInfiniteQuery } from "@bookjeok/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useCallback } from "react";

import { useDeleteMyCommentMutation } from "@/features/comment/mutations";
import { useConfirm } from "@/features/confirm";
import { BookIcon, QuoteUpCircleIcon } from "@/shared/components/icons";
import {
  ChevronRight,
  Heart,
  Loader2,
  MessageSquare,
  Search,
  Trash2,
} from "@/shared/components/icons/iconsax";
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import { Card, CardContent } from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";
import { formatDate } from "@/shared/utils/format-date";

/**
 * 타겟 타입에 따른 링크 생성
 */
const getTargetLink = (targetType: CommentTargetType, targetId: string) => {
  switch (targetType) {
    case CommentTargetType.BOOK:
      return PATHS.BOOK_DETAIL(targetId);
    case CommentTargetType.REVIEW:
      return PATHS.REVIEW_DETAIL(targetId);
    default:
      return "#";
  }
};

/**
 * 내가 쓴 댓글 목록 컴포넌트
 * - 무한 스크롤 지원
 * - 댓글 삭제 기능 포함
 */
export const MyCommentList = () => {
  const t = useTranslations("my_comments");
  const locale = useLocale();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useMyCommentsInfiniteQuery();
  const { mutate: deleteComment, isPending: isDeleting } =
    useDeleteMyCommentMutation();

  const confirm = useConfirm();

  const handleDelete = useCallback(
    (commentId: number) => {
      deleteComment(commentId);
    },
    [deleteComment],
  );

  const handleDeleteClick = useCallback(
    async (commentId: number) => {
      const isConfirmed = await confirm({
        title: t("delete_modal.title"),
        description: t("delete_modal.desc"),
        confirmText: t("delete_modal.confirm"),
        cancelText: t("delete_modal.cancel"),
        variant: "destructive",
      });

      if (isConfirmed) {
        handleDelete(commentId);
      }
    },
    [confirm, handleDelete, t],
  );

  if (isLoading) {
    return <MyCommentListSkeleton />;
  }

  const allComments = data?.pages.flatMap((page) => page.data) ?? [];

  if (allComments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40 p-12 text-center space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400">
          <MessageSquare className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            {t("empty.title")}
          </h3>
          <p className="text-xs text-stone-400 max-w-sm">{t("empty.desc")}</p>
        </div>
        <Button
          asChild
          size="sm"
          className="mt-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 gap-1.5 shadow-2xs rounded-lg cursor-pointer"
        >
          <Link href={PATHS.REVIEWS}>
            <Search className="h-3.5 w-3.5" />
            {t("btn_explore_reviews")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {allComments.map((comment) => {
          const isReview = comment.targetType === CommentTargetType.REVIEW;
          const targetHref = getTargetLink(
            comment.targetType,
            comment.targetId,
          );

          return (
            <Card
              key={comment.id}
              className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs hover:shadow-xs transition-all duration-200 bg-white dark:bg-stone-900/80 overflow-hidden group"
            >
              <CardContent className="p-4 sm:p-5 space-y-3">
                {/* 상단 메타 바: 등록일시, 배지, 삭제 액션 */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 dark:border-stone-800 text-xs">
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <span>{formatDate(comment.createdAt, locale, "date")}</span>
                    <span>·</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 h-5 font-medium border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                    >
                      {isReview ? t("type_review") : t("type_book")}
                    </Badge>
                  </div>

                  {/* 삭제 버튼 */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 pointer-fine:h-7 pointer-fine:w-7 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer transition-colors"
                    disabled={isDeleting}
                    onClick={() => handleDeleteClick(comment.id)}
                    title={t("delete_modal.title")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* 메인: 타겟 아이콘 & 정보 & 내 댓글 */}
                <div className="flex gap-3.5 sm:gap-4 items-start">
                  {/* 타겟 아이콘 */}
                  <Link
                    href={targetHref}
                    className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 group-hover:border-stone-300 transition-all shadow-2xs"
                  >
                    {isReview ? (
                      <QuoteUpCircleIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
                    ) : (
                      <BookIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
                    )}
                  </Link>

                  {/* 타겟 텍스트 & 댓글 내용 */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Link
                      href={targetHref}
                      className="block font-serif font-bold text-stone-900 dark:text-stone-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-base line-clamp-1"
                    >
                      {comment.targetTitle || t("no_title")}
                    </Link>

                    {comment.targetSubtitle && (
                      <p className="text-xs text-stone-500 line-clamp-1">
                        {comment.targetSubtitle}
                      </p>
                    )}

                    {/* 내 댓글 박스 */}
                    <div className="mt-1 rounded-lg bg-stone-50/80 dark:bg-stone-800/50 p-2.5 sm:p-3 border border-stone-100 dark:border-stone-800/80">
                      <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed line-clamp-3">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 하단 바: 좋아요 & 원문 상세 바로가기 */}
                <div className="pt-2 flex items-center justify-between gap-2.5 border-t border-stone-100 dark:border-stone-800">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-medium",
                      comment.likeCount > 0
                        ? "text-rose-500 dark:text-rose-400"
                        : "text-stone-400",
                    )}
                  >
                    <Heart
                      variant={comment.likeCount > 0 ? "bold" : "outline"}
                      className="w-3.5 h-3.5"
                    />
                    <span>
                      {comment.likeCount > 0
                        ? t("likes_count", { count: comment.likeCount })
                        : t("no_likes")}
                    </span>
                  </div>

                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs px-2.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 group-hover:translate-x-0.5 transition-all"
                  >
                    <Link href={targetHref}>
                      {isReview ? t("view_review") : t("view_book")}
                      <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 더 보기 버튼 */}
      {hasNextPage && (
        <div className="flex justify-center pt-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-8 border-stone-200 dark:border-stone-700 text-xs font-medium"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("loading")}
              </>
            ) : (
              t("load_more")
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * 스켈레톤 컴포넌트
 */
export const MyCommentListSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4].map((i) => (
      <Card
        key={i}
        className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900/80 p-4 sm:p-5 space-y-3"
      >
        <CardContent className="p-0 space-y-3">
          {/* 상단 메타 스켈레톤 */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
          {/* 본문 스켈레톤 */}
          <div className="flex gap-3.5 sm:gap-4 items-start">
            <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2 py-0.5">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-12 w-full rounded-lg mt-1" />
            </div>
          </div>
          {/* 하단 바 스켈레톤 */}
          <div className="pt-2 flex items-center justify-between border-t border-stone-100 dark:border-stone-800">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);
