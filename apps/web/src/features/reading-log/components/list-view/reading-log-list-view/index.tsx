"use client";

import { ReadingLog } from "@bookjeok/core";
import { useReadingLogsInfiniteQuery } from "@bookjeok/react-query";
import { format, parseISO } from "date-fns";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

import { BookOpen } from "@/shared/components/icons/iconsax";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { cn } from "@/shared/utils";
import { getDateLocale } from "@/shared/utils/format-date";

import { getSeasonalTheme } from "../../../hooks/use-seasonal-theme";
import { useReceivedKongMap } from "../../kong/hooks/use-received-kong-map";
import { KongReceivedLine } from "../../kong/kong-received-line";

interface ReadingLogListViewProps {
  logs?: ReadingLog[];
  readOnly?: boolean;
}

export function ReadingLogListView({
  logs: propLogs,
  readOnly = false,
}: ReadingLogListViewProps = {}) {
  const t = useTranslations("reading_log.list");
  const locale = useLocale();
  const dateLocale = getDateLocale(locale);

  const isControlled = Boolean(propLogs);
  const [visibleCount, setVisibleCount] = useState(10);

  const queryResult = useReadingLogsInfiniteQuery({ enabled: !isControlled });
  const kongs = useReceivedKongMap({ enabled: !readOnly });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    isControlled
      ? {
          data: null,
          fetchNextPage: () => {},
          hasNextPage: false,
          isFetchingNextPage: false,
          status: "success" as const,
        }
      : queryResult;

  const { ref, inView } = useInView();

  const totalControlledCount = propLogs?.length || 0;
  const hasMoreControlled = isControlled && visibleCount < totalControlledCount;

  useEffect(() => {
    if (inView) {
      if (isControlled && hasMoreControlled) {
        setVisibleCount((prev) => Math.min(prev + 10, totalControlledCount));
      } else if (!isControlled && hasNextPage) {
        fetchNextPage();
      }
    }
  }, [
    inView,
    isControlled,
    hasMoreControlled,
    hasNextPage,
    fetchNextPage,
    totalControlledCount,
  ]);

  if (!isControlled && status === "pending") {
    return <ReadingLogListSkeleton />;
  }

  if (!isControlled && status === "error") {
    return <div className="text-center py-8 text-red-500">{t("error")}</div>;
  }

  const allLogs: ReadingLog[] = isControlled
    ? (propLogs || []).slice(0, visibleCount)
    : data?.pages.flatMap((page) => page.items) || [];

  if (allLogs.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500 bg-stone-50 rounded-xl">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allLogs.map((log, index) => {
        const currentDate = parseISO(log.date);
        const prevDate = index > 0 ? parseISO(allLogs[index - 1].date) : null;

        // 아이템별 동적 테마 적용
        const theme = getSeasonalTheme(currentDate);

        const showHeader =
          !prevDate ||
          format(currentDate, "yyyy-MM") !== format(prevDate, "yyyy-MM");

        return (
          <Fragment key={log.id}>
            {showHeader && (
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-3 border-b border-stone-100 mb-4 transition-all">
                <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                  <span
                    className={cn(
                      "w-2.5 h-2.5 rounded-full shadow-sm",
                      theme.todayBg,
                    )}
                  />
                  {/* 헤더도 해당 월의 테마를 따라감 */}
                  {format(currentDate, t("header_date_format"), {
                    locale: dateLocale,
                  })}
                </h3>
              </div>
            )}
            <div
              className={cn(
                "flex gap-4 p-3.5 sm:p-4 bg-white rounded-2xl border border-stone-100 shadow-sm transition-all group",
                "hover:shadow-md hover:-translate-y-0.5",
                // 동적 테두리 색상 (hover)
                `hover:${theme.border}`,
              )}
            >
              <div className="relative w-20 h-28 sm:w-24 sm:h-32 shrink-0 rounded-xl overflow-hidden bg-stone-100 shadow-xs ring-1 ring-black/5">
                {log.book.image ? (
                  <Image
                    src={log.book.image}
                    alt={log.book.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 80px, 96px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stone-400">
                    <BookOpen className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-stone-900 line-clamp-1 mb-1 text-base sm:text-lg font-serif tracking-tight">
                      {log.book.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-500 line-clamp-1 mb-2.5 font-medium">
                      {log.book.author}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] sm:text-xs font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border shrink-0 whitespace-nowrap",
                      theme.bg,
                      theme.primary,
                      theme.border,
                    )}
                  >
                    {format(currentDate, t("item_date_format"), {
                      locale: dateLocale,
                    })}
                  </span>
                </div>
                {log.memo && (
                  <div
                    className={cn(
                      "p-2.5 sm:p-3.5 rounded-xl text-xs sm:text-sm mt-0.5 whitespace-pre-wrap leading-relaxed font-medium",
                      theme.bg,
                      theme.activeText,
                    )}
                  >
                    {log.memo}
                  </div>
                )}
                <KongReceivedLine log={kongs.get(log.id)} className="mt-2" />
              </div>
            </div>
          </Fragment>
        );
      })}

      {/* 무한 스크롤 트리거 */}
      <div ref={ref} className="h-4 w-full">
        {(isFetchingNextPage || (isControlled && hasMoreControlled)) && (
          <div className="py-4 space-y-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        )}
      </div>
    </div>
  );
}

function ReadingLogListSkeleton() {
  return (
    <div className="space-y-6">
      {/* 고정 헤더 스켈레톤 */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-3 border-b border-stone-100 mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-2.5 h-2.5 rounded-full bg-stone-200" />
          <Skeleton className="h-6 w-32 bg-stone-200" />
        </div>
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 bg-white rounded-2xl border border-stone-100 shadow-sm"
        >
          <Skeleton className="w-24 h-32 shrink-0 rounded-lg bg-stone-100 shadow-md ring-1 ring-black/5" />
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4 bg-stone-100" />
                <Skeleton className="h-4 w-1/2 bg-stone-50" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full bg-stone-100" />
            </div>
            <Skeleton className="h-16 w-full rounded-xl mt-3 bg-stone-50" />
          </div>
        </div>
      ))}
    </div>
  );
}
