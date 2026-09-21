"use client";

import { ReadingLog } from "@bookjeok/core";
import { format, isAfter, startOfDay } from "date-fns";
import Image from "next/image";
import { useLocale } from "next-intl";

import { cn } from "@/shared/utils";
import { formatDate } from "@/shared/utils/format-date";

import { SeasonalTheme } from "../../../constants/ui";

interface ReadingLogDayCellProps {
  date: Date;
  logs: ReadingLog[];
  isCurrentMonth: boolean;
  onClick: () => void;
  theme: SeasonalTheme;
}

export function ReadingLogDayCell({
  date,
  logs,
  isCurrentMonth,
  onClick,
  theme,
}: ReadingLogDayCellProps) {
  const locale = useLocale();
  const isToday =
    format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const isFuture = isAfter(date, startOfDay(new Date()));
  const hasLogs = logs.length > 0;
  const firstLog = hasLogs ? logs[0] : null;
  const extraCount = Math.max(0, logs.length - 1);

  const formattedDate = format(date, "yyyy-MM-dd");
  const cellAriaLabel = `${formattedDate}${hasLogs ? ` (${logs.length})` : ""}`;

  return (
    <div
      role={isFuture || !isCurrentMonth ? undefined : "button"}
      tabIndex={isFuture || !isCurrentMonth ? -1 : 0}
      aria-label={cellAriaLabel}
      onClick={isFuture ? undefined : onClick}
      onKeyDown={(e) => {
        if (
          (e.key === "Enter" || e.key === " ") &&
          !isFuture &&
          isCurrentMonth
        ) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "relative p-1 h-full sm:p-2 flex flex-col transition-all duration-300 group hover:z-10 outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:z-20",
        isFuture ? "cursor-default" : "cursor-pointer",
        !isFuture && theme.hoverBg,
        !isCurrentMonth && "opacity-30 pointer-events-none bg-stone-50/50",
        isToday && "bg-stone-50/50",
      )}
    >
      {/* 날짜 표시 */}
      <div className="flex justify-between items-start mb-1 h-5 shrink-0 sm:h-6">
        <span
          className={cn(
            "text-[11px] w-5 h-5 flex sm:text-xs sm:w-6 sm:h-6 items-center justify-center rounded-full transition-all duration-300 font-serif z-10",
            isToday
              ? cn(
                  "shadow-md ring-2 ring-offset-1 font-bold scale-110",
                  theme.todayBg,
                  theme.todayText,
                  theme.ring,
                )
              : cn(
                  "text-stone-500 font-medium",
                  !isFuture &&
                    "group-hover:scale-110 group-hover:bg-white group-hover:shadow-sm",
                  !isFuture && `group-hover:${theme.activeText}`,
                ),
          )}
        >
          {formatDate(date, locale, "day")}
        </span>
      </div>

      {/* 통합 View: 책 표지 Hero UI (모바일은 미니 표지, 데스크탑은 표지+제목) */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0 w-full">
        {hasLogs && firstLog ? (
          <div className="w-full h-full flex flex-col items-center gap-1 sm:gap-2 group/book justify-center">
            {/* 책 표지 이미지 (메인) */}
            <div
              className={cn(
                "relative h-[85%] sm:h-full w-auto aspect-2/3 shadow-md rounded-sm sm:rounded-md overflow-hidden transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-1 ring-1 ring-black/5 bg-stone-100",
                // 테마에 따른 은은한 그림자 색상
                `group-hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_0_0_1px_${theme.border.replace(
                  "border-",
                  "",
                )}]`,
              )}
            >
              <Image
                src={firstLog.book.image}
                alt={firstLog.book.title}
                fill
                unoptimized
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* 여러 권일 경우 뱃지 (이미지 위 오버레이) */}
              {extraCount > 0 && (
                <div
                  className={cn(
                    "absolute bottom-0 right-0 px-1 sm:px-1.5 py-0.5 bg-black/60 backdrop-blur-[2px] text-[9px] sm:text-[10px] font-bold text-white rounded-tl-md rounded-br-sm sm:rounded-br-md z-10",
                  )}
                >
                  +{extraCount}
                </div>
              )}
            </div>

            {/* 책 제목 (데스크탑만 노출) */}
            <p
              className={cn(
                "hidden sm:block text-[10px] sm:text-xs text-center font-medium leading-tight text-stone-600 truncate px-1 w-full transition-colors group-hover:text-stone-900",
              )}
            >
              {firstLog.book.title}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
