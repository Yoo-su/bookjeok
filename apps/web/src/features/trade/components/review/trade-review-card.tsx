"use client";

import {
  POSITIVE_TRADE_REVIEW_TAGS,
  TradeReview,
  TradeReviewTag,
} from "@bookjeok/core";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { BookIcon } from "@/shared/components/icons";
import { ThumbsDown, ThumbsUp, User } from "@/shared/components/icons/iconsax";
import { Card, CardContent } from "@/shared/components/shadcn/card";
import { formatDate } from "@/shared/utils/format-date";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface TradeReviewCardProps {
  review: TradeReview;
}

export const TradeReviewCard = ({ review }: TradeReviewCardProps) => {
  const t = useTranslations("order.trade_review");
  const locale = useLocale();

  const reviewerAvatar = getProfileImageUrl(review.reviewer?.profileImageUrl);
  const reviewerNickname = review.reviewer?.nickname || t("anonymous_reviewer");
  const bookTitle =
    review.completion?.sale?.title || review.completion?.sale?.book?.title;

  return (
    <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs hover:shadow-xs transition-shadow duration-200 bg-white dark:bg-stone-900/80">
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        {/* 상단: 작성자 프로필 & 작성일 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-8 w-8 rounded-full overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 shrink-0">
              {reviewerAvatar ? (
                <Image
                  src={reviewerAvatar}
                  alt={reviewerNickname}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <User className="h-4 w-4 text-stone-400 m-auto" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block truncate">
                {reviewerNickname}
              </span>
              <span className="text-[11px] text-stone-400">
                {formatDate(review.createdAt, locale, "date")}
              </span>
            </div>
          </div>

          {/* 대상 도서 제목 요약 */}
          {bookTitle && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-stone-500 bg-stone-50 dark:bg-stone-800/60 px-2.5 py-1 rounded-md max-w-[200px] truncate border border-stone-200/60 dark:border-stone-700">
              <BookIcon className="h-3 w-3 shrink-0 text-stone-400" />
              <span className="truncate">{bookTitle}</span>
            </div>
          )}
        </div>

        {/* 태그 뱃지 목록 */}
        {review.tags && review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {review.tags.map((tag) => {
              const isPositive = POSITIVE_TRADE_REVIEW_TAGS.includes(
                tag as TradeReviewTag,
              );
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                    isPositive
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700"
                      : "bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-800/60 dark:text-stone-300 dark:border-stone-700"
                  }`}
                >
                  {isPositive ? (
                    <ThumbsUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <ThumbsDown className="h-3 w-3 text-stone-400 shrink-0" />
                  )}
                  {t(`tags.${tag}`)}
                </span>
              );
            })}
          </div>
        )}

        {/* 작성 텍스트 후기 내용 */}
        {review.content && (
          <div className="rounded-xl bg-stone-50 dark:bg-stone-800/40 p-3 text-xs text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap border border-stone-200/60 dark:border-stone-800">
            {review.content}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
