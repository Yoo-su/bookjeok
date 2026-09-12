"use client";

import type { LoungeBookCard } from "@bookjeok/core";
import { useLoungeFeedInfiniteQuery } from "@bookjeok/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { ImpressionArea } from "@/shared/components/common/impression-area";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

import { LoungeEmptyState } from "../lounge-empty-state";
import { LoungeFeedCard } from "../lounge-feed-card";

interface LoungeFeedListProps {
  onCardClick?: (
    isbn: string,
    book: LoungeBookCard["book"],
    totalCount: number,
  ) => void;
}

export function LoungeFeedList({ onCardClick }: LoungeFeedListProps) {
  const t = useTranslations("lounge.feed");

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLoungeFeedInfiniteQuery();

  const handleCardClick = (item: LoungeBookCard) => {
    if (onCardClick) {
      onCardClick(item.isbn, item.book, item.totalReaderCount);
    }
  };

  if (isLoading) {
    return (
      <section>
        <div className="mb-10 border-b border-stone-200 dark:border-stone-800 pb-5">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900/80 p-4 sm:p-5 space-y-3"
            >
              {/* 상단 메타 스켈레톤 */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              {/* 본문 스켈레톤 */}
              <div className="flex gap-3.5 sm:gap-4 items-start">
                <Skeleton className="h-24 w-18 sm:h-28 sm:w-20 rounded-md shrink-0" />
                <div className="flex-1 space-y-2 py-0.5">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-10 w-full rounded-lg mt-1" />
                </div>
              </div>
              {/* 하단 바 스켈레톤 */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-100 dark:border-stone-800">
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const items = data?.pages.flatMap((page) => page.items ?? []) ?? [];

  if (isError && items.length === 0) {
    return (
      <section>
        <div className="py-20 text-center">
          <p className="text-stone-400 text-sm">{t("error")}</p>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return <LoungeEmptyState />;
  }

  return (
    <section>
      {/* 섹션 헤더 */}
      <div className="mb-10 border-b border-stone-200 dark:border-stone-800 pb-5">
        <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 dark:text-stone-100 font-medium tracking-tight">
          {t("title")}
        </h2>
        <p className="mt-2 text-sm sm:text-base text-stone-500 font-light">
          {t("subtitle")}
        </p>
      </div>

      {/* 피드 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={item.isbn}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: Math.min(index * 0.05, 0.3),
                duration: 0.35,
              }}
            >
              <LoungeFeedCard item={item} onCardClick={handleCardClick} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 로딩 / 완료 인디케이터 (선언적 뷰포트 감지) */}
      <ImpressionArea
        onImpression={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        className="py-8 flex justify-center"
      >
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-stone-400 text-sm">
            <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" />
            <span className="ml-1.5 font-light">{t("loading_more")}</span>
          </div>
        )}
        {!hasNextPage && items.length > 0 && !isError && (
          <p className="text-stone-300 text-xs font-light">{t("all_loaded")}</p>
        )}
        {isError && items.length > 0 && (
          <p className="text-red-400 text-xs font-light">{t("error")}</p>
        )}
      </ImpressionArea>
    </section>
  );
}
