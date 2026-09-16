"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React from "react";

import {
  AlertCircle,
  Home,
  RefreshCw,
} from "@/shared/components/icons/iconsax";
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

export const OrderPaymentFailView = () => {
  const t = useTranslations("order.payment.fail");
  const searchParams = useSearchParams();

  const code = searchParams.get("code") || "PAYMENT_FAILED";
  const message = searchParams.get("message") || t("default_message");
  const orderId = searchParams.get("orderId");

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            {t("title")}
          </h1>
          <p className="text-xs text-stone-500">{t("subtitle")}</p>
        </div>
      </div>

      {/* 실패 사유 카드 */}
      <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs bg-stone-50/60 dark:bg-stone-900/60">
        <CardHeader className="pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold text-stone-700 dark:text-stone-300">
              {t("error_info")}
            </CardTitle>
            <Badge
              variant="outline"
              className="font-mono text-[11px] border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400"
            >
              {code}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-2 text-xs">
          <div className="rounded-xl bg-white dark:bg-stone-800 p-3 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 leading-relaxed text-xs">
            {message}
          </div>
          <p className="text-[11px] text-stone-400 leading-normal">
            {t("help_text")}
          </p>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        {orderId ? (
          <Button
            asChild
            size="lg"
            className="flex-1 font-bold h-12 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs cursor-pointer"
          >
            <Link href={PATHS.ORDER_PAYMENT(orderId)}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              {t("btn_retry")}
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            size="lg"
            className="flex-1 font-bold h-12 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs cursor-pointer"
          >
            <Link href={PATHS.HOME}>
              <Home className="h-4 w-4 mr-1.5" />
              {t("btn_go_home")}
            </Link>
          </Button>
        )}
        <Button
          asChild
          variant="outline"
          size="lg"
          className="sm:w-36 h-12 rounded-xl border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
        >
          <Link href={PATHS.HOME}>
            <Home className="h-4 w-4 mr-1.5" />
            {t("btn_go_home")}
          </Link>
        </Button>
      </div>
    </div>
  );
};
