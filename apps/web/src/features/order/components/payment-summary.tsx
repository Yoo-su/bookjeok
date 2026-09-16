"use client";

import { Order } from "@bookjeok/core";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React from "react";

import { BookIcon, ShieldSecurityIcon } from "@/shared/components/icons";
import { User } from "@/shared/components/icons/iconsax";
import { Badge } from "@/shared/components/shadcn/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";
import { Separator } from "@/shared/components/shadcn/separator";
import { PriceDisplay } from "@/shared/components/ui/price-display";

interface PaymentSummaryProps {
  order: Order;
}

export const PaymentSummary = ({ order }: PaymentSummaryProps) => {
  const t = useTranslations("order.payment");
  const sale = order.sale;
  const bookImage = sale?.imageUrls?.[0] || sale?.book?.image || null;

  return (
    <Card className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs bg-white dark:bg-stone-900/80">
      <CardHeader className="bg-stone-50/60 dark:bg-stone-800/40 pb-3 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-stone-900 dark:text-stone-100">
            <BookIcon className="h-4 w-4 text-stone-700 dark:text-stone-300" />
            {t("product_info")}
          </CardTitle>
          <Badge
            variant="outline"
            className="text-[11px] font-mono border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400"
          >
            {order.id}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* 상품 정보 카드 */}
        <div className="flex gap-3.5 items-start">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800">
            {bookImage ? (
              <Image
                src={bookImage}
                alt={sale?.title || "Book"}
                fill
                className="object-cover"
                sizes="64px"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-stone-400">
                <BookIcon className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between flex-1 min-w-0">
            <div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug">
                {sale?.title || t("fallback_book_title")}
              </h4>
              {sale?.book?.author && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                  {sale.book.author}
                </p>
              )}
            </div>
            {order.seller && (
              <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 mt-2">
                <User className="h-3 w-3" />
                <span>{t("seller_info")}:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {order.seller.nickname}
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-stone-100 dark:bg-stone-800" />

        {/* 금액 명세 */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-stone-500 dark:text-stone-400">
            <span>{t("book_price")}</span>
            <PriceDisplay
              value={order.amount}
              size="sm"
              className="text-stone-800 dark:text-stone-200 font-semibold tabular-nums"
            />
          </div>
          <div className="flex justify-between text-stone-500 dark:text-stone-400">
            <span>{t("shipping_fee")}</span>
            <span className="font-medium text-stone-900 dark:text-stone-100">
              {t("shipping_free")}
            </span>
          </div>
          <Separator className="my-2 bg-stone-100 dark:bg-stone-800" />
          <div className="flex justify-between items-center text-sm font-bold pt-1">
            <span className="text-stone-900 dark:text-stone-100">
              {t("total_amount")}
            </span>
            <PriceDisplay
              value={order.amount}
              size="lg"
              className="text-stone-900 dark:text-stone-100 font-extrabold text-lg tabular-nums"
            />
          </div>
        </div>

        {/* 에스크로 보호 배너 */}
        <div className="flex items-start gap-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 p-3 text-xs text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-800">
          <ShieldSecurityIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-stone-900 dark:text-stone-100 block text-xs">
              {t("escrow_protection")}
            </span>
            <p className="leading-relaxed text-[11px] text-stone-500 dark:text-stone-400">
              {t("escrow_desc")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
