"use client";

import {
  useSellerStatsQuery,
  useUserTradeReviewsQuery,
} from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  MessageSquareDashed,
  ShieldAlert,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

import { SellerStatsCard } from "./seller-stats-card";
import { TradeReviewCard } from "./trade-review-card";

interface UserTradeReviewsListProps {
  handle: string;
}

export const UserTradeReviewsList = ({ handle }: UserTradeReviewsListProps) => {
  const t = useTranslations("order.trade_review");
  const tCommon = useTranslations("common.actions");
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  const { data: stats, isLoading: isStatsLoading } = useSellerStatsQuery(
    handle,
    {
      enabled: !!handle,
    },
  );

  const {
    data: reviewsData,
    isLoading: isReviewsLoading,
    isError,
    refetch,
  } = useUserTradeReviewsQuery(handle, { page, limit }, { enabled: !!handle });

  const reviews = reviewsData?.reviews || [];
  const total = reviewsData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* 1. 판매자 거래 통계 요약 카드 */}
      {isStatsLoading ? (
        <div className="rounded-2xl border border-stone-200/80 bg-white dark:bg-stone-900/60 p-6 shadow-2xs space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
      ) : (
        stats && <SellerStatsCard stats={stats} />
      )}

      {/* 2. 후기 목록 섹션 헤더 */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <span>{t("list.title")}</span>
          {total > 0 && (
            <span className="text-xs font-mono font-medium text-stone-400">
              ({total})
            </span>
          )}
        </h3>
      </div>

      {/* 로딩 스켈레톤 */}
      {isReviewsLoading && (
        <div className="space-y-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      )}

      {/* 에러 상태 */}
      {isError && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 p-8 text-center space-y-3">
          <ShieldAlert className="h-9 w-9 text-stone-400" />
          <p className="text-xs text-stone-500">{t("list.error")}</p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="border-stone-200 dark:border-stone-700"
          >
            {tCommon("retry")}
          </Button>
        </div>
      )}

      {/* 빈 상태 */}
      {!isReviewsLoading && !isError && reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40 p-12 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400">
            <MessageSquareDashed className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {t("list.empty_title")}
            </h4>
            <p className="text-xs text-stone-400 max-w-sm">
              {t("list.empty_desc")}
            </p>
          </div>
        </div>
      )}

      {/* 후기 카드 목록 */}
      {!isReviewsLoading && !isError && reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((review) => (
            <TradeReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {!isReviewsLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-stone-200 dark:border-stone-700"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium text-stone-500 px-2 font-mono">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-stone-200 dark:border-stone-700"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
