"use client";

import {
  POSITIVE_TRADE_REVIEW_TAGS,
  SellerTradeStats,
  TradeReviewTag,
} from "@bookjeok/core";
import { useTranslations } from "next-intl";
import React from "react";

import { ShieldSecurityIcon } from "@/shared/components/icons";
import { ThumbsDown, ThumbsUp } from "@/shared/components/icons/iconsax";
import { Badge } from "@/shared/components/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";

interface SellerStatsCardProps {
  stats: SellerTradeStats;
}

export const SellerStatsCard = ({ stats }: SellerStatsCardProps) => {
  const t = useTranslations("order.trade_review");

  // 태그별 집계 정렬 (빈도수 내림차순, 1회 이상 집계된 태그만 우선)
  const tagCounts = stats.tagCounts || {};
  const activeTags = Object.entries(tagCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs bg-white dark:bg-stone-900/80 overflow-hidden">
      <CardHeader className="bg-stone-50/60 dark:bg-stone-800/40 pb-3 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-stone-900 dark:text-stone-100">
            <ShieldSecurityIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {t("stats.title")}
          </CardTitle>
          <Badge className="bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold gap-1">
            <ThumbsUp className="h-3 w-3" />
            {t("stats.positive_rate", { rate: stats.positiveRate })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* 1. 3단 주요 지표 수치 그리드 */}
        <div className="grid grid-cols-3 gap-3 divide-x divide-stone-100 dark:divide-stone-800 text-center">
          <div className="px-2">
            <span className="text-[11px] text-stone-400 block font-medium">
              {t("stats.completed_label")}
            </span>
            <div className="mt-1 flex items-baseline justify-center gap-1">
              <span className="font-mono text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                {stats.totalCompletedSales}
              </span>
              <span className="text-xs text-stone-400">
                {t("stats.unit_count")}
              </span>
            </div>
            {/*
              직거래 완료는 판매자 자기신고, 안전결제는 에스크로 구매확정을
              거친 기록이라 신뢰도가 다르다. 합계 아래에 내역을 함께 보여준다.
            */}
            <span className="mt-0.5 block text-[10px] text-stone-400">
              {t("stats.split_detail", {
                direct: stats.directCompletedSales,
                delivery: stats.deliveryCompletedSales,
              })}
            </span>
          </div>

          <div className="px-2">
            <span className="text-[11px] text-stone-400 block font-medium">
              {t("stats.received_reviews")}
            </span>
            <div className="mt-1 flex items-baseline justify-center gap-1">
              <span className="font-mono text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
                {stats.totalReviews}
              </span>
              <span className="text-xs text-stone-400">
                {t("stats.unit_reviews")}
              </span>
            </div>
          </div>

          <div className="px-2">
            <span className="text-[11px] text-stone-400 block font-medium">
              {t("stats.satisfaction")}
            </span>
            <div className="mt-1 flex items-baseline justify-center gap-1">
              <span className="font-mono text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.positiveRate}%
              </span>
            </div>
          </div>
        </div>

        {/* 2. 받은 평가 태그 요약 집계 */}
        <div className="space-y-3 pt-1 border-t border-stone-100 dark:border-stone-800">
          <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300">
            {t("stats.tag_summary_title")}
          </h4>

          {activeTags.length === 0 ? (
            <p className="text-xs text-stone-400 py-2">
              {t("stats.no_reviews")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeTags.map(([tagKey, count]) => {
                const isPositive = POSITIVE_TRADE_REVIEW_TAGS.includes(
                  tagKey as TradeReviewTag,
                );
                return (
                  <div
                    key={tagKey}
                    className="flex items-center justify-between px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 text-xs text-stone-800 dark:text-stone-200"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                      {isPositive ? (
                        <ThumbsUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <ThumbsDown className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      )}
                      <span className="truncate font-medium">
                        {t(`tags.${tagKey}`)}
                      </span>
                    </div>
                    <span className="font-mono font-bold shrink-0 text-stone-900 dark:text-stone-100">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
