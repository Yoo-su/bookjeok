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
import {
  AnimatePresence,
  motion,
  useReducedMotionConfig,
  type Variants,
} from "motion/react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { useOverlay } from "@/shared/hooks/use-overlay";
import { cn } from "@/shared/utils";

import { MONTH_TURN } from "../../../constants/ui";
import { useReadingLogPrefetch } from "../../../hooks/use-reading-log-prefetch";
import { useSeasonalTheme } from "../../../hooks/use-seasonal-theme";
import { groupLogsByDate, logsInMonth } from "../../../utils/month-logs";
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

/**
 * 넘긴 쪽에서 들어오고 반대쪽으로 빠짐. 자주 누르는 곳이라 짧게. custom은 밀 거리 방향(동작 줄이기면 0)
 * - transform 문자열로 움직여 합성 스레드에서 돈다. 새 달 칸을 그리는 동안에도 끊기지 않게
 */
const monthSlide: Variants = {
  enter: (dir: number) => ({
    transform: `translateX(${dir * 24}px)`,
    opacity: 0,
  }),
  center: {
    transform: "translateX(0px)",
    opacity: 1,
    transition: MONTH_TURN.enter,
  },
  // 다른 해를 받는 동안 이전 달을 흐리게 둠. 짧은 대기에는 흐려지지 않게 늦게 시작
  waiting: {
    transform: "translateX(0px)",
    opacity: 0.45,
    transition: { delay: 0.2, duration: 0.2 },
  },
  exit: (dir: number) => ({
    transform: `translateX(${dir * -24}px)`,
    opacity: 0,
    transition: MONTH_TURN.exit,
  }),
};

// 기본값을 렌더마다 새로 만들면 칸 묶음 memo가 매번 풀림
const NO_LOGS: ReadingLog[] = [];

interface ReadingLogCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  readOnly?: boolean;
  initialLogs?: ReadingLog[];
  /** 넘기면 보기 모드를 밖에서 제어한다(내 독서기록 페이지가 마지막 보기를 기억한다) */
  viewMode?: ReadingLogViewMode;
  onViewModeChange?: (mode: ReadingLogViewMode) => void;
  /** 이 날짜의 상세를 그해 기록을 받은 뒤 한 번 띄움(dock 달력 패널에서 넘어온 딥링크) */
  openDate?: Date | null;
  onOpenDateHandled?: () => void;
}

export function ReadingLogCalendar({
  currentDate,
  onDateChange,
  readOnly = false,
  initialLogs = NO_LOGS,
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

  // 이웃 해와 앞뒤 달 표지 미리 받기 - readOnly가 아닐 때만
  useReadingLogPrefetch(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    !readOnly,
  );

  // 그해 기록을 한 번 받고 달은 여기서 거른다. 통계도 이 목록에서 세므로 보기 모드와 상관없이 받는다
  const {
    data: yearLogs,
    isLoading: isYearLoading,
    isPlaceholderData,
  } = useReadingLogsQuery(
    { year: currentDate.getFullYear() },
    { enabled: !readOnly, keepPrevious: true },
  );

  const isLoading = readOnly ? false : isYearLoading;
  // 다른 해를 받는 중. yearLogs는 아직 그리고 있는 해의 기록
  const isWaiting = !readOnly && isPlaceholderData;

  // 그리는 달은 그해 기록이 있어야 넘어감(같은 해는 바로). 넘긴 방향으로 슬라이드
  const [shownMonth, setShownMonth] = useState(() => startOfMonth(currentDate));
  const [direction, setDirection] = useState(1);
  // transform 문자열은 MotionConfig가 줄여 주지 않아 직접 밀지 않게 한다
  const slide = useReducedMotionConfig() ? 0 : direction;
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

  // 그리는 달의 기록만 칸에 둔다. 체험 달력은 예시 전체를 넘겨 이웃 달 칸에도 흐린 표지가 보인다(전과 같음)
  const logsByDate = useMemo(
    () =>
      groupLogsByDate(
        readOnly ? initialLogs : logsInMonth(yearLogs ?? [], monthStart),
      ),
    [readOnly, initialLogs, yearLogs, monthStart],
  );
  const getLogsForDate = (date: Date): ReadingLog[] =>
    logsByDate.get(format(date, "yyyy-MM-dd")) ?? [];

  const handleDayClick = (date: Date) => {
    // 다른 해를 받는 동안 남아 있는 이전 달 칸이 열리지 않게(키보드 포함)
    if (isWaiting) return;
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

  // 부모가 openDate를 비우기 전에 다시 그려져도 한 번만 띄움
  const openedDateRef = useRef<Date | null>(null);
  useEffect(() => {
    if (
      !openDate ||
      openedDateRef.current === openDate ||
      readOnly ||
      viewMode !== "calendar" ||
      isLoading ||
      isWaiting
    )
      return;
    // 그 달로 넘어가기 전 렌더에서는 이전 달 기록이라 기다림
    if (!isSameMonth(openDate, monthStart)) return;
    openedDateRef.current = openDate;
    handleDayClick(openDate);
    onOpenDateHandled?.();
  });

  return (
    <div className="w-full mx-auto space-y-6">
      {!readOnly && (
        <ReadingLogStats
          month={monthStart}
          logs={yearLogs}
          isLoading={isLoading}
          theme={theme}
        />
      )}

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
              <AnimatePresence initial={false} mode="popLayout" custom={slide}>
                <motion.div
                  key={monthStart.getTime()}
                  custom={slide}
                  variants={monthSlide}
                  initial="enter"
                  animate={isWaiting ? "waiting" : "center"}
                  exit="exit"
                  // 받는 중인 이전 달을 누르거나 Tab으로 들어가 지난 기록이 열리지 않게
                  inert={isWaiting}
                  className={cn(
                    "grid grid-cols-7 gap-1 p-2 sm:auto-rows-[160px] sm:gap-0 sm:p-0 sm:divide-x sm:divide-y sm:divide-gray-100",
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
