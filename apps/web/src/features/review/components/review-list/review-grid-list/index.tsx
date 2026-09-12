"use client";

import { useReviewsInfiniteQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import {
  AlertTriangle,
  MessageSquare,
  Plus,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { ReviewCard } from "../../common/review-card";
import { ReviewCardSkeleton } from "../../common/review-card/skeleton";
import { ReviewGridListSkeleton } from "./skeleton";

interface ReviewGridListProps {
  searchQuery: string;
  category: string | null;
  clearFilters: () => void;
  onDeleteReview?: (id: number) => void;
  onEditReview?: (id: number) => void;
  userId?: number;
}

export function ReviewGridList({
  searchQuery,
  category,
  clearFilters,
  onDeleteReview,
  onEditReview,
  userId,
}: ReviewGridListProps) {
  // 데이터 조회
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReviewsInfiniteQuery({
    limit: 12,
    category,
    search: searchQuery,
    userId,
  });

  const t = useTranslations("review.list");
  const tCommon = useTranslations("common");

  // Intersection Observer로 무한 스크롤 트리거 감지
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  // 스크롤이 하단에 도달하고 다음 페이지가 있으면 추가 데이터 로드
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 로딩 상태
  if (isLoading) {
    return <ReviewGridListSkeleton />;
  }

  // 에러 발생 시
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 p-10 text-center space-y-3">
        <AlertTriangle className="h-9 w-9 text-stone-400" />
        <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
          {t("error")}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="mt-2 border-stone-200 dark:border-stone-700"
        >
          {tCommon("actions.retry")}
        </Button>
      </div>
    );
  }

  const reviews =
    data?.pages.flatMap((page) =>
      Array.isArray(page?.reviews) ? page.reviews : [],
    ) ?? [];

  // 결과 없음
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40 p-12 text-center space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400">
          <MessageSquare className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            {searchQuery || category
              ? t("empty_search_title")
              : t("empty_list_title")}
          </h3>
          <p className="text-xs text-stone-400 max-w-sm">
            {searchQuery || category
              ? t("empty_search_desc")
              : t("empty_list_desc")}
          </p>
        </div>
        {searchQuery || category ? (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="mt-2 border-stone-200 dark:border-stone-700"
          >
            {t("view_all")}
          </Button>
        ) : (
          <Button
            asChild
            size="sm"
            className="mt-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 gap-1.5 shadow-2xs rounded-lg cursor-pointer"
          >
            <Link href={PATHS.REVIEW_WRITE}>
              <Plus className="h-3.5 w-3.5" />
              {t("write_first")}
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        {reviews.map((review, index) => (
          <li key={review.id}>
            <ReviewCard.Root review={review} priority={index < 4}>
              <ReviewCard.Image />
              <ReviewCard.Content>
                <ReviewCard.Meta />
                <ReviewCard.Title />
                <ReviewCard.Tags />
                <ReviewCard.Action
                  onEdit={onEditReview}
                  onDelete={onDeleteReview}
                />
              </ReviewCard.Content>
            </ReviewCard.Root>
          </li>
        ))}
        {isFetchingNextPage && (
          <>
            <li>
              <ReviewCardSkeleton />
            </li>
            <li>
              <ReviewCardSkeleton />
            </li>
          </>
        )}
      </ul>

      {/* Infinite Scroll Trigger */}
      <div ref={ref} className="h-10 invisible" />
    </div>
  );
}
