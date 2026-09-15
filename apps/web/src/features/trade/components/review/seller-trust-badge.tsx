"use client";

import { useSellerStatsQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import React from "react";

import { ShieldSecurityIcon } from "@/shared/components/icons";
import { cn } from "@/shared/utils/cn";

interface SellerTrustBadgeProps {
  handle: string;
  size?: "sm" | "md";
  className?: string;
}

export const SellerTrustBadge = ({
  handle,
  size = "md",
  className,
}: SellerTrustBadgeProps) => {
  const t = useTranslations("order.trade_review.stats");

  // 신뢰 지표는 거래 완료 기록에서 나오고 완료는 결제 없이도 생기므로,
  // 결제 봉인 여부와 무관하게 노출한다.
  const { data: stats, isLoading } = useSellerStatsQuery(handle, {
    enabled: Boolean(handle),
  });

  if (isLoading || !stats) {
    return null;
  }

  if (stats.totalCompletedSales === 0 && stats.totalReviews === 0) {
    return null;
  }

  const isSmall = size === "sm";

  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium whitespace-nowrap",
        isSmall ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        className,
      )}
    >
      <ShieldSecurityIcon
        className={cn(
          "text-emerald-600 dark:text-emerald-400 shrink-0",
          isSmall ? "h-3 w-3" : "h-3.5 w-3.5",
        )}
      />
      <span className="truncate">
        {/*
          직거래 완료는 판매자 자기신고, 택배 거래는 에스크로 구매확정을 거친
          기록이라 신뢰도가 다르다. 합산만 보여주면 그 차이가 가려지므로 나눠 쓴다.
        */}
        {/*
          만족도는 "이 사람이 받은 후기"의 비율이다. 받은 후기가 없는데 100%를
          띄우면 본인이 남긴 후기가 자기 평가처럼 읽힌다. 후기가 있을 때만 쓴다.
        */}
        {stats.totalReviews === 0
          ? t("badge_trades_only", {
              count: stats.totalCompletedSales,
            })
          : stats.deliveryCompletedSales > 0
            ? t("badge_trust_split", {
                direct: stats.directCompletedSales,
                delivery: stats.deliveryCompletedSales,
                rate: stats.positiveRate,
              })
            : t("badge_trust_direct", {
                count: stats.directCompletedSales,
                rate: stats.positiveRate,
              })}
      </span>
    </div>
  );
};
