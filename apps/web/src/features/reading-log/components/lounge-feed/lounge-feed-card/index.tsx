"use client";

import { LoungeBookCard } from "@bookjeok/core";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { memo } from "react";

import { BookIcon, QuoteUpIcon } from "@/shared/components/icons";
import { ChevronRight } from "@/shared/components/icons/iconsax";
import { AvatarCircles } from "@/shared/components/magicui/avatar-circles";
import { Badge } from "@/shared/components/shadcn/badge";
import { Card, CardContent } from "@/shared/components/shadcn/card";
import { cn } from "@/shared/utils/cn";
import { formatRelativeTime } from "@/shared/utils/format-date";

interface LoungeFeedCardProps {
  item: LoungeBookCard;
  onCardClick: (item: LoungeBookCard) => void;
}

export const LoungeFeedCard = memo(function LoungeFeedCard({
  item,
  onCardClick,
}: LoungeFeedCardProps) {
  const t = useTranslations("lounge.feed");
  const locale = useLocale();

  // 서버 페이로드에서 배열이 빠져도 카드 한 장 때문에 페이지가 500이 되지 않게
  const readers = item.readers ?? [];
  const firstReader = readers[0];
  // 최근 독자들 중 메모를 작성한 가장 최근 독자 찾기
  const readerWithMemo = readers.find((r) => Boolean(r.memo?.trim()));

  return (
    <Card
      onClick={() => onCardClick(item)}
      className={cn(
        "rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs hover:shadow-xs transition-all duration-200",
        "bg-white dark:bg-stone-900/80 overflow-hidden cursor-pointer group hover:-translate-y-0.5",
      )}
    >
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* 상단 메타 바: 등록일시, 독자 수 */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 dark:border-stone-800 text-xs">
          <span className="text-stone-400 font-medium">
            {formatRelativeTime(item.latestDate, locale)}
          </span>

          <Badge
            variant="secondary"
            className="text-[10px] py-0 px-1.5 h-5 font-medium"
          >
            {t("readers_count", { count: item.totalReaderCount })}
          </Badge>
        </div>

        {/* 메인: 도서 썸네일 & 도서 정보 */}
        <div className="flex gap-3.5 sm:gap-4 items-start">
          {/* 도서 표지 */}
          <div className="relative h-24 w-18 sm:h-28 sm:w-20 shrink-0 overflow-hidden rounded-md border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 shadow-2xs">
            {item.book.image ? (
              <Image
                src={item.book.image}
                alt={item.book.title}
                fill
                sizes="80px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-stone-400">
                <BookIcon className="h-6 w-6" />
              </div>
            )}
          </div>

          {/* 도서 텍스트 & 최근 감상 */}
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors text-base line-clamp-1">
              {item.book.title}
            </h3>

            <p className="text-xs text-stone-500 line-clamp-1">
              {item.book.author}
              {item.book.publisher && ` · ${item.book.publisher}`}
            </p>

            {readerWithMemo ? (
              <div className="mt-1 flex items-start gap-2 rounded-lg bg-stone-50/80 dark:bg-stone-800/50 p-2.5 border border-stone-100 dark:border-stone-800/80">
                <QuoteUpIcon className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
                <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed italic flex-1 min-w-0 pr-1.5 break-words">
                  {readerWithMemo.memo}
                </p>
              </div>
            ) : item.book.description ? (
              <p className="text-xs text-stone-400 dark:text-stone-500 line-clamp-2 pt-0.5 leading-relaxed">
                {item.book.description}
              </p>
            ) : (
              <p className="text-xs text-stone-400 dark:text-stone-500 line-clamp-1 pt-0.5">
                {firstReader?.nickname
                  ? `${firstReader.nickname}님이 기록한 도서입니다.`
                  : "최근 기록된 도서입니다."}
              </p>
            )}
          </div>
        </div>

        {/* 하단 바: 독자 아바타 & 상세 보기 */}
        <div className="pt-2 flex items-center justify-between gap-2.5 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2 min-w-0">
            <AvatarCircles
              size="sm"
              avatars={readers.slice(0, 3).map((r) => ({
                imageUrl: r.profileImageUrl,
                name: r.nickname,
              }))}
              extraCount={
                item.totalReaderCount > 3 ? item.totalReaderCount - 3 : 0
              }
            />
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium truncate">
              {readers.length === 1 && firstReader
                ? firstReader.nickname
                : t("readers_summary", { count: item.totalReaderCount })}
            </span>
          </div>

          <div className="flex items-center text-xs font-medium text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors shrink-0">
            <span>{t("view_details")}</span>
            <ChevronRight className="h-3.5 w-3.5 ml-0.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
