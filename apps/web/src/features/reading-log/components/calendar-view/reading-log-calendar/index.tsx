"use client";

import { ReadingLog } from "@bookjeok/core";
import { useReadingLogsQuery } from "@bookjeok/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useOverlay } from "@/shared/hooks/use-overlay";
import { cn } from "@/shared/utils";

import { useReadingLogPrefetch } from "../../../hooks/use-reading-log-prefetch";
import { useSeasonalTheme } from "../../../hooks/use-seasonal-theme";
import { DayDetailsDialog } from "../../common/day-details-dialog";
import { ReadingLogListView } from "../../list-view/reading-log-list-view";
import { ReadingLogStats } from "../../stats-view/reading-log-stats";
import { TowerSkeleton } from "../../tower-view/tower-skeleton";
import { ReadingLogCalendarSkeleton } from "../reading-log-calendar-skeleton";
import {
  ReadingLogControls,
  ReadingLogViewMode,
} from "../reading-log-controls";
import { ReadingLogDayCell } from "../reading-log-day-cell";

// 책탑은 누른 뒤에만 그리므로 공개 프로필(readOnly) 번들에서 뺀다
const ReadingTower = dynamic(
  () => import("../../tower-view/reading-tower").then((m) => m.ReadingTower),
  { ssr: false, loading: () => <TowerSkeleton /> },
);

interface ReadingLogCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  readOnly?: boolean;
  initialLogs?: ReadingLog[];
  /** 넘기면 보기 모드를 밖에서 제어한다(내 독서기록 페이지가 마지막 보기를 기억한다) */
  viewMode?: ReadingLogViewMode;
  onViewModeChange?: (mode: ReadingLogViewMode) => void;
}

export function ReadingLogCalendar({
  currentDate,
  onDateChange,
  readOnly = false,
  initialLogs = [],
  viewMode: controlledViewMode,
  onViewModeChange,
}: ReadingLogCalendarProps) {
  const t = useTranslations("reading_log.calendar");
  const overlay = useOverlay();
  const [innerViewMode, setInnerViewMode] =
    useState<ReadingLogViewMode>("calendar");
  const viewMode = controlledViewMode ?? innerViewMode;
  const setViewMode = onViewModeChange ?? setInnerViewMode;

  // 계절 테마 훅 사용
  const theme = useSeasonalTheme(currentDate);

  // 인접한 월 데이터 prefetch - readOnly가 아닐 때만
  useReadingLogPrefetch(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    !readOnly,
  );

  // API 호출 - 캘린더 모드일 때만 월별 기록 조회
  const {
    data: fetchedMonthlyLogs = [],
    isLoading: isMonthlyLoading,
    isFetching: isMonthlyFetching,
  } = useReadingLogsQuery(
    { year: currentDate.getFullYear(), month: currentDate.getMonth() + 1 },
    { enabled: viewMode === "calendar" && !readOnly },
  );

  const logs: ReadingLog[] = readOnly ? initialLogs : fetchedMonthlyLogs;
  const isLoading = readOnly ? false : isMonthlyLoading;
  const isFetching = readOnly ? false : isMonthlyFetching;

  const handlePrevMonth = () => onDateChange(subMonths(currentDate, 1));
  const handleNextMonth = () => onDateChange(addMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  const getLogsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return logs.filter((log) => log.date === dateStr);
  };

  const handleDayClick = (date: Date) => {
    overlay.open(({ isOpen, close }) => (
      <DayDetailsDialog
        date={date}
        logs={getLogsForDate(date)}
        open={isOpen}
        onOpenChange={(open) => !open && close()}
        readOnly={readOnly}
      />
    ));
  };

  return (
    <div className="w-full mx-auto space-y-6">
      {!readOnly && <ReadingLogStats currentDate={currentDate} theme={theme} />}

      <ReadingLogControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentDate={currentDate}
        onDateChange={onDateChange}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        isLoading={readOnly ? false : isFetching}
        readOnly={readOnly}
      />

      {viewMode === "tower" && !readOnly ? (
        // 연도마다 새로 마운트해 인트로·측정·선택 상태를 처음부터 시작한다
        <ReadingTower
          key={currentDate.getFullYear()}
          year={currentDate.getFullYear()}
        />
      ) : viewMode === "list" ? (
        <ReadingLogListView
          logs={readOnly ? initialLogs : undefined}
          readOnly={readOnly}
        />
      ) : isLoading ? (
        <ReadingLogCalendarSkeleton />
      ) : (
        <div className="pb-4">
          <div
            className={cn(
              "bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl shadow-stone-300/40 border border-stone-200/80 overflow-hidden ring-1 transition-all duration-500",
              theme.ring, // ring-color
            )}
          >
            {/* 요일 헤더 - 그라데이션 배경 (Dynamic Theme) */}
            <div
              className={cn(
                "grid grid-cols-7 border-b border-stone-100/50 transition-all duration-500 bg-linear-to-r",
                theme.gradient,
              )}
            >
              {weekDayKeys.map((dayKey, i) => (
                <div
                  key={dayKey}
                  className={cn(
                    "py-2.5 text-center text-xs font-semibold sm:py-4 sm:text-sm tracking-wide transition-colors duration-500",
                    i === 0
                      ? theme.primary // 일요일 (Primary Color)
                      : i === 6
                        ? theme.activeText // 토요일 (Active/Dark Color)
                        : theme.accent, // 평일 (Accent/Gray Color)
                  )}
                >
                  {t(`weekdays.${dayKey}`)}
                </div>
              ))}
            </div>

            {/* 캘린더 그리드 */}
            <div className="grid grid-cols-7 auto-rows-[100px] sm:auto-rows-[160px] divide-x divide-y divide-gray-100">
              {calendarDays.map((day) => (
                <ReadingLogDayCell
                  key={day.toISOString()}
                  date={day}
                  logs={getLogsForDate(day)}
                  isCurrentMonth={isSameMonth(day, monthStart)}
                  onClick={() => handleDayClick(day)}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
