"use client";

import { TradeRoleFilter } from "@bookjeok/core";
import { useMyTradeCompletionsQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Handshake,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { FilterTabs } from "@/shared/components/ui/filter-tabs";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { TradeHistoryCard } from "./trade-history-card";
import { TradeHistorySkeleton } from "./trade-history-skeleton";

const LIMIT = 10;

/**
 * 내가 사거나 판 거래의 완료 내역.
 *
 * 직거래는 주문 기록이 없어 구매내역·판매주문에 잡히지 않습니다. 채팅방을
 * 나가면 후기를 남길 창구가 사라지므로 이 목록이 그 역할을 합니다.
 */
export const TradeHistoryList = () => {
  const t = useTranslations("trade.history");

  const [role, setRole] = useState<TradeRoleFilter>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useMyTradeCompletionsQuery({
    role,
    page,
    limit: LIMIT,
  });

  const tabs: { key: TradeRoleFilter; label: string }[] = [
    { key: "ALL", label: t("tabs.all") },
    { key: "BUYER", label: t("tabs.bought") },
    { key: "SELLER", label: t("tabs.sold") },
  ];

  const handleTabChange = (next: TradeRoleFilter) => {
    setRole(next);
    setPage(1);
  };

  const completions = data?.completions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* 역할 필터 탭 */}
      <FilterTabs tabs={tabs} value={role} onChange={handleTabChange} />

      {isLoading && <TradeHistorySkeleton />}

      {isError && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 p-10 text-center space-y-3">
          <AlertTriangle className="h-9 w-9 text-stone-400" />
          <h3 className="font-bold text-stone-900 dark:text-stone-100">
            {t("error_title")}
          </h3>
          <p className="text-xs text-stone-500">{t("error_desc")}</p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="mt-2 border-stone-200 dark:border-stone-700"
          >
            {t("btn_retry")}
          </Button>
        </div>
      )}

      {!isLoading && !isError && completions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40 p-12 text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400">
            <Handshake className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              {t("empty_title")}
            </h3>
            <p className="text-xs text-stone-400 max-w-sm">{t("empty_desc")}</p>
          </div>
          <Button
            asChild
            size="sm"
            className="mt-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900"
          >
            <Link href={PATHS.BOOK_MARKET}>{t("btn_browse_market")}</Link>
          </Button>
        </div>
      )}

      {!isLoading && !isError && completions.length > 0 && (
        <div className="space-y-3">
          {completions.map((completion) => (
            <TradeHistoryCard key={completion.id} completion={completion} />
          ))}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
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
