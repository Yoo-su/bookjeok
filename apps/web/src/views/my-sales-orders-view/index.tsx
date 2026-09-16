"use client";

import { useTranslations } from "next-intl";
import React from "react";

import { MySalesOrdersList } from "@/features/order";
import { ArrowLeft } from "@/shared/components/icons/iconsax";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

export const MySalesOrdersView = () => {
  const t = useTranslations("order.sales_orders");
  const tMyPage = useTranslations("my_page");

  return (
    <div className="w-full space-y-6">
      {/* 상단 헤더 */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <Link
          href={PATHS.MY_PAGE}
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 mb-2 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {tMyPage("title")}
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          {t("title")}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* 판매 주문 목록 및 필터 */}
      <MySalesOrdersList />
    </div>
  );
};
