"use client";

import { OrderStatus } from "@bookjeok/core";
import { useMySalesOrdersQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

import { BoxIcon } from "@/shared/components/icons";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";

import { SalesOrderCard } from "./sales-order-card";
import { SalesOrdersSkeleton } from "./sales-orders-skeleton";

type FilterTabKey =
  | "ALL"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CONFIRMED"
  | "CANCELLED";

export const MySalesOrdersList = () => {
  const t = useTranslations("order.sales_orders");
  const tCommon = useTranslations("common.actions");
  const [activeTab, setActiveTab] = useState<FilterTabKey>("ALL");
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  const statusParam =
    activeTab === "ALL" ? undefined : (activeTab as OrderStatus);

  const { data, isLoading, isError, refetch } = useMySalesOrdersQuery({
    page,
    limit,
    status: statusParam,
  });

  const tabs: { key: FilterTabKey; label: string }[] = [
    { key: "ALL", label: t("tabs.all") },
    { key: "AWAITING_PAYMENT", label: t("tabs.awaiting_payment") },
    { key: "PAID", label: t("tabs.paid") },
    { key: "SHIPPED", label: t("tabs.shipped") },
    { key: "DELIVERED", label: t("tabs.delivered") },
    { key: "CONFIRMED", label: t("tabs.confirmed") },
    { key: "CANCELLED", label: t("tabs.cancelled_disputed") },
  ];

  const handleTabChange = (tab: FilterTabKey) => {
    setActiveTab(tab);
    setPage(1);
  };

  const orders = data?.orders || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* 상태 필터 탭 바 (모바일 가로 스크롤) */}
      <div className="border-b border-stone-200 dark:border-stone-800">
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs"
                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && <SalesOrdersSkeleton />}

      {/* 에러 상태 */}
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
            {tCommon("retry")}
          </Button>
        </div>
      )}

      {/* 빈 목록 상태 */}
      {!isLoading && !isError && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40 p-12 text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400">
            <BoxIcon className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              {t("empty_title")}
            </h3>
            <p className="text-xs text-stone-400 max-w-sm">{t("empty_desc")}</p>
          </div>
        </div>
      )}

      {/* 판매 주문 카드 목록 */}
      {!isLoading && !isError && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => (
            <SalesOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
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
