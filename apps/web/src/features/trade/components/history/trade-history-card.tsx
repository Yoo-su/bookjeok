"use client";

import { TradeCompletion, TradeCompletionMethod } from "@bookjeok/core";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { BookIcon, TruckFastIcon } from "@/shared/components/icons";
import { Handshake, Pencil } from "@/shared/components/icons/iconsax";
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import { Card, CardContent } from "@/shared/components/shadcn/card";
import { PriceDisplay } from "@/shared/components/ui/price-display";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { formatDate } from "@/shared/utils/format-date";

import { TradeReviewModal } from "../review/trade-review-modal";

interface TradeHistoryCardProps {
  completion: TradeCompletion;
}

/** 완료된 거래 한 건. 후기 작성·수정 진입점을 겸한다. */
export const TradeHistoryCard = ({ completion }: TradeHistoryCardProps) => {
  const t = useTranslations("trade.history");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const sale = completion.sale;
  const counterparty = completion.counterparty;
  const isDelivery = completion.method === TradeCompletionMethod.DELIVERY;
  const isBuyer = completion.myRole === "BUYER";

  const cover = sale?.imageUrls?.[0] || sale?.book?.image;

  // 후기는 삭제할 수 없고 14일 이내에만 고칠 수 있다.
  const canEditReview =
    Boolean(completion.myReview) &&
    Boolean(completion.reviewExpiresAt) &&
    new Date(completion.reviewExpiresAt as string).getTime() > Date.now();

  return (
    <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs hover:shadow-xs transition-all duration-200 bg-white dark:bg-stone-900/80 overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* 상단 메타: 거래일, 방식, 내 역할 */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 dark:border-stone-800 text-xs">
          <span className="text-stone-400">
            {formatDate(completion.completedAt, locale, "date")}
          </span>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] font-medium gap-1 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300"
            >
              {isDelivery ? (
                <TruckFastIcon className="h-3 w-3" />
              ) : (
                <Handshake className="h-3 w-3" />
              )}
              {isDelivery ? t("method_delivery") : t("method_direct")}
            </Badge>
            <Badge className="h-5 px-1.5 text-[10px] font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-transparent">
              {isBuyer ? t("role_buyer") : t("role_seller")}
            </Badge>
          </div>
        </div>

        {/* 메인: 책 정보 */}
        <div className="flex gap-3.5 items-start">
          <Link
            href={PATHS.BOOK_SALES_DETAIL(String(completion.saleId))}
            className="relative h-22 w-16 shrink-0 overflow-hidden rounded-md border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 group shadow-2xs"
          >
            {cover ? (
              <Image
                src={cover}
                alt={sale?.title ?? ""}
                fill
                sizes="64px"
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-stone-400">
                <BookIcon className="h-5 w-5" />
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0 space-y-1">
            <Link
              href={PATHS.BOOK_SALES_DETAIL(String(completion.saleId))}
              className="block font-serif font-bold text-stone-900 dark:text-stone-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-base line-clamp-1"
            >
              {sale?.title}
            </Link>

            {sale?.book && (
              <p className="text-xs text-stone-500 line-clamp-1">
                {sale.book.title}
                {sale.book.author && ` · ${sale.book.author}`}
              </p>
            )}

            {counterparty && (
              <p className="text-xs text-stone-400 pt-0.5">
                {isBuyer ? t("counterparty_seller") : t("counterparty_buyer")}{" "}
                <Link
                  href={PATHS.USER_PROFILE(counterparty.handle)}
                  className="font-medium text-stone-600 dark:text-stone-300 hover:underline"
                >
                  {counterparty.nickname}
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* 하단 바: 금액 + 후기 액션 */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-stone-400">{t("price")}</span>
            <PriceDisplay
              value={sale?.price ?? 0}
              className="text-base font-bold text-stone-900 dark:text-stone-100 tabular-nums"
              unitClassName="text-xs font-normal text-stone-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {completion.canWriteReview && (
              <Button
                size="sm"
                className="h-8 text-xs bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg shadow-2xs cursor-pointer"
                onClick={() => setIsReviewModalOpen(true)}
              >
                {t("btn_write_review")}
              </Button>
            )}

            {completion.myReview && (
              <>
                <span className="text-xs text-stone-400">
                  {t("review_written")}
                </span>
                {canEditReview && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-lg border-stone-200 dark:border-stone-700 cursor-pointer"
                    onClick={() => setIsReviewModalOpen(true)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    {t("btn_edit_review")}
                  </Button>
                )}
              </>
            )}

            {!completion.canWriteReview && !completion.myReview && (
              <span className="text-xs text-stone-400">
                {t("review_expired")}
              </span>
            )}
          </div>
        </div>
      </CardContent>

      <TradeReviewModal
        completionId={completion.id}
        targetRole={isBuyer ? "SELLER" : "BUYER"}
        method={completion.method}
        targetUserNickname={counterparty?.nickname}
        existingReview={completion.myReview}
        open={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
      />
    </Card>
  );
};
