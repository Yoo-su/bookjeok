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
import { AnimatePresence, motion, type Variants } from "motion/react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useOverlay } from "@/shared/hooks/use-overlay";
import { cn } from "@/shared/utils";

import { useReadingLogPrefetch } from "../../../hooks/use-reading-log-prefetch";
import { useSeasonalTheme } from "../../../hooks/use-seasonal-theme";
import { DayDetailsDialog } from "../../common/day-details-dialog";
import { ReadingLogListView } from "../../list-view/reading-log-list-view";
import { StackSkeleton } from "../../stack-view/stack-skeleton";
import { ReadingLogStats } from "../../stats-view/reading-log-stats";
import { ReadingLogCalendarSkeleton } from "../reading-log-calendar-skeleton";
import {
  ReadingLogControls,
  ReadingLogViewMode,
} from "../reading-log-controls";
import { ReadingLogDayCell } from "../reading-log-day-cell";

// 독서 키재기는 누른 뒤에만 그리므로 공개 프로필(readOnly) 번들에서 뺀다
const ReadingStack = dynamic(
  () => import("../../stack-view/reading-stack").then((m) => m.ReadingStack),
  { ssr: false, loading: () => <StackSkeleton /> },
);

/** 넘긴 쪽에서 들어오고 반대쪽으로 빠짐. 자주 누르는 곳이라 짧게 */
const monthSlide: Variants = {
  enter: (dir: number) => ({ x: dir * 24, opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
  },
  // 다음 달을 받는 동안 이전 달을 흐리게 둠. 짧은 대기에는 흐려지지 않게 늦게 시작
  waiting: { x: 0, opacity: 0.45, transition: { delay: 0.2, duration: 0.2 } },
  exit: (dir: number) => ({
    x: dir * -24,
    opacity: 0,
    transition: { duration: 0.14, ease: "easeIn" },
  }),
};

interface ReadingLogCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  readOnly?: boolean;
  initialLogs?: ReadingLog[];
  /** 넘기면 보기 모드를 밖에서 제어한다(내 독서기록 페이지가 마지막 보기를 기억한다) */
  viewMode?: ReadingLogViewMode;
  onViewModeChange?: (mode: ReadingLogViewMode) => void;
  /** 이 날짜의 상세를 그 달 기록을 받은 뒤 한 번 띄움(dock 달력 패널에서 넘어온 딥링크) */
  openDate?: Date | null;
  onOpenDateHandled?: () => void;
}

export function ReadingLogCalendar({
  currentDate,
  onDateChange,
  readOnly = false,
  initialLogs = [],
  viewMode: controlledViewMode,
  onViewModeChange,
  openDate,
  onOpenDateHandled,
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
    isPlaceholderData,
  } = useReadingLogsQuery(
    { year: currentDate.getFullYear(), month: currentDate.getMonth() + 1 },
    { enabled: viewMode === "calendar" && !readOnly, keepPrevious: true },
  );

  const logs: ReadingLog[] = readOnly ? initialLogs : fetchedMonthlyLogs;
  const isLoading = readOnly ? false : isMonthlyLoading;
  // 다른 달을 받는 중. logs는 아직 그리고 있는 달의 기록
  const isWaiting = !readOnly && isPlaceholderData;

  // 그리는 달은 기록이 도착해야 넘어감. 넘긴 방향으로 슬라이드
  const [shownMonth, setShownMonth] = useState(() => startOfMonth(currentDate));
  const [direction, setDirection] = useState(1);
  const targetMonth = startOfMonth(currentDate);
  if (!isWaiting && targetMonth.getTime() !== shownMonth.getTime()) {
    setDirection(targetMonth > shownMonth ? 1 : -1);
    setShownMonth(targetMonth);
  }

  const handlePrevMonth = () => onDateChange(subMonths(currentDate, 1));
  const handleNextMonth = () => onDateChange(addMonths(currentDate, 1));

  const monthStart = shownMonth;
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

  useEffect(() => {
    if (
      !openDate ||
      readOnly ||
      viewMode !== "calendar" ||
      isLoading ||
      isWaiting
    )
      return;
    // 달이 바뀌기 전 렌더에서는 이전 달 기록이라 기다림
    if (!isSameMonth(openDate, currentDate)) return;
    handleDayClick(openDate);
    onOpenDateHandled?.();
  });

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
        // 받는 동안에도 이전 달을 그대로 두므로 처음 불러올 때만 막는다.
        // 다시 받기마다 막으면 화살표가 흐려지고 연달아 누른 클릭이 먹힌다
        isLoading={isLoading}
        readOnly={readOnly}
      />

      {viewMode === "stack" && !readOnly ? (
        // 연도마다 새로 마운트해 인트로·측정·선택 상태를 처음부터 시작한다
        <ReadingStack
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
                // 모바일은 아래 칸 그리드와 같은 여백·간격이어야 요일과 칸 열이 맞음
                "grid grid-cols-7 gap-1 px-2 border-b border-stone-100/50 transition-all duration-500 bg-linear-to-r sm:gap-0 sm:px-0",
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
            {/* 모바일은 dock 달력 패널처럼 표지 칸을 띄워 배치, sm 이상은 칸을 선으로 나눈 표 */}
            {/* popLayout: 빠지는 달을 겹쳐 띄워 들어오는 달이 제자리에서 시작 */}
            <div className="relative" aria-busy={isWaiting}>
              <AnimatePresence
                initial={false}
                mode="popLayout"
                custom={direction}
              >
                <motion.div
                  key={monthStart.getTime()}
                  custom={direction}
                  variants={monthSlide}
                  initial="enter"
                  animate={isWaiting ? "waiting" : "center"}
                  exit="exit"
                  className={cn(
                    "grid grid-cols-7 gap-1 p-2 sm:auto-rows-[160px] sm:gap-0 sm:p-0 sm:divide-x sm:divide-y sm:divide-gray-100",
                    // 받는 중인 이전 달을 눌러 지난 기록이 열리지 않게
                    isWaiting && "pointer-events-none",
                  )}
                >
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
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
