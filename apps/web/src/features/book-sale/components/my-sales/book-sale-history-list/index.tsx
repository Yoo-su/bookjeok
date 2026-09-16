"use client";

import { SaleStatus } from "@bookjeok/core";
import { useMyBookSalesQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ShoppingBagIcon } from "@/shared/components/icons";
import { AlertTriangle, Plus } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { BookSaleHistoryItem } from "./item";
import { BookSaleHistoryListSkeleton } from "./skeleton";

type FilterTabKey = "ALL" | SaleStatus;

export const BookSaleHistoryList = () => {
  const t = useTranslations("market.history");
  const tCommon = useTranslations("common.actions");
  const [activeTab, setActiveTab] = useState<FilterTabKey>("ALL");
  const { data: sales, isLoading, isError, refetch } = useMyBookSalesQuery();

  const tabs: { key: FilterTabKey; label: string }[] = [
    { key: "ALL", label: t("tabs.all") },
    { key: SaleStatus.FOR_SALE, label: t("tabs.for_sale") },
    { key: SaleStatus.RESERVED, label: t("tabs.reserved") },
    { key: SaleStatus.SOLD, label: t("tabs.sold") },
  ];

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    if (activeTab === "ALL") return sales;
    return sales.filter((sale) => sale.status === activeTab);
  }, [sales, activeTab]);

  const counts = useMemo(() => {
    if (!sales) {
      return {
        ALL: 0,
        [SaleStatus.FOR_SALE]: 0,
        [SaleStatus.RESERVED]: 0,
        [SaleStatus.SOLD]: 0,
      };
    }
    return {
      ALL: sales.length,
      [SaleStatus.FOR_SALE]: sales.filter(
        (s) => s.status === SaleStatus.FOR_SALE,
      ).length,
      [SaleStatus.RESERVED]: sales.filter(
        (s) => s.status === SaleStatus.RESERVED,
      ).length,
      [SaleStatus.SOLD]: sales.filter((s) => s.status === SaleStatus.SOLD)
        .length,
    };
  }, [sales]);

  if (isLoading) {
    return <BookSaleHistoryListSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 p-10 text-center space-y-3">
        <AlertTriangle className="h-9 w-9 text-stone-400" />
        <h3 className="font-bold text-stone-900 dark:text-stone-100">
          {t("error_title")}
        </h3>
        <p className="text-xs text-stone-500 max-w-sm">{t("error_desc")}</p>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="mt-2 border-stone-200 dark:border-stone-700"
        >
          {tCommon("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 상태 필터 탭 바 (모바일 가로 스크롤) */}
      <div className="border-b border-stone-200 dark:border-stone-800">
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = counts[tab.key];
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-2xs"
                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span
                    className={`ml-1 text-[11px] ${isActive ? "opacity-90 font-mono" : "text-stone-400 font-mono"}`}
                  >
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 빈 목록 상태 */}
      {filteredSales.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40 p-12 text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400">
            <ShoppingBagIcon className="h-7 w-7" />
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
            className="mt-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 gap-1.5 shadow-2xs rounded-lg cursor-pointer"
          >
            <Link href={PATHS.BOOK_SALES_REGISTER}>
              <Plus className="h-3.5 w-3.5" />
              {t("btn_register_sale")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSales.map((sale) => (
            <BookSaleHistoryItem key={sale.id} sale={sale} />
          ))}
        </div>
      )}
    </div>
  );
};
