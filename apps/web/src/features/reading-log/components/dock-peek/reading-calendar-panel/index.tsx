"use client";

import type { ReadingLog } from "@bookjeok/core";
import { useReadingLogsQuery } from "@bookjeok/react-query";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  format,
  isAfter,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "@/shared/components/icons/iconsax";
import { DockPanel } from "@/shared/components/ui/dock-panel";
import { Link } from "@/shared/config/i18n/routing";
import { cn } from "@/shared/utils/cn";

import { useReadingLogPrefetch } from "../../../hooks/use-reading-log-prefetch";
import { readingLogHref } from "../../../utils/reading-log-link";
import { CoverDayCell } from "../../common/cover-day-cell";

interface ReadingCalendarPanelProps {
  open: boolean;
  onClose: () => void;
}

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const iconButton =
  "flex size-9 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:pointer-events-none disabled:opacity-30 active:scale-95";

/**
 * 기록 달력 미리보기. 보기 전용이며 날짜를 누르면 독서기록 페이지의 그날로 넘어감
 * - 날짜 숫자를 표지 위에 얹어 칸 전체를 표지로 씀(좁은 화면에서도 표지가 보이게)
 */
export const ReadingCalendarPanel = ({
  open,
  onClose,
}: ReadingCalendarPanelProps) => {
  const t = useTranslations("reading_log.peek");
  const tCal = useTranslations("reading_log.calendar");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  // 열 때마다 이번 달부터
  useEffect(() => {
    if (open) setMonth(startOfMonth(new Date()));
  }, [open]);

  const { data: logs = [], isLoading } = useReadingLogsQuery(
    { year: month.getFullYear(), month: month.getMonth() + 1 },
    { enabled: open },
  );
  // 앞뒤 달을 미리 받아 넘길 때 빈 칸으로 기다리지 않게
  useReadingLogPrefetch(month.getFullYear(), month.getMonth() + 1, open, false);

  const logsByDate = useMemo(() => {
    const map = new Map<string, ReadingLog[]>();
    for (const log of logs) {
      const list = map.get(log.date);
      if (list) list.push(log);
      else map.set(log.date, [log]);
    }
    return map;
  }, [logs]);

  // 늘 6주를 그림. 달마다 4~6주로 바뀌면 넘길 때 패널 높이가 출렁임
  const firstDay = startOfWeek(month);
  const days = eachDayOfInterval({
    start: firstDay,
    end: addDays(firstDay, 6 * 7 - 1),
  });
  const today = startOfDay(new Date());
  const isCurrentMonth = isSameMonth(month, today);

  return (
    <DockPanel
      open={open}
      onClose={onClose}
      label={t("calendar_title")}
      dismissOnOutsideClick
      desktopClassName="w-[min(30rem,calc(100vw-2rem))]"
      desktopMaxHeight="44rem"
      mobileClassName=""
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-2 px-3 pb-2 pt-1 group-data-[layout=card]/dock-panel:pt-3">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setMonth((m) => subMonths(m, 1))}
              aria-label={t("prev_month")}
              className={iconButton}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <h2 className="min-w-[7.5rem] text-center text-base font-bold tabular-nums text-stone-900">
              {t("month_label", {
                year: month.getFullYear(),
                month: month.getMonth() + 1,
              })}
            </h2>
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              disabled={isCurrentMonth}
              aria-label={t("next_month")}
              className={iconButton}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {!isLoading && (
            <span className="pr-2 text-sm font-semibold tabular-nums text-emerald-700">
              {t("month_count", { count: logs.length })}
            </span>
          )}
        </header>

        <div className="min-h-0 overflow-y-auto px-3">
          <div className="relative grid grid-cols-7 gap-1 pb-1">
            {WEEKDAY_KEYS.map((key, i) => (
              <span
                key={key}
                className={cn(
                  "py-1 text-center text-[11px] font-semibold text-stone-400",
                  i === 0 && "text-rose-400",
                )}
              >
                {tCal(`weekdays.${key}`)}
              </span>
            ))}

            {days.map((day) => {
              // 다른 달 칸도 같은 비율로 자리를 잡아야 6주가 늘 같은 높이
              if (!isSameMonth(day, month)) {
                return (
                  <span
                    key={day.toISOString()}
                    aria-hidden="true"
                    className="aspect-[3/4]"
                  />
                );
              }
              const dayLogs = logsByDate.get(format(day, "yyyy-MM-dd")) ?? [];
              return (
                <CoverDayCell
                  key={day.toISOString()}
                  day={day}
                  logs={dayLogs}
                  isFuture={isAfter(day, today)}
                  isLoading={isLoading}
                  href={readingLogHref({ date: day })}
                  onClick={onClose}
                />
              );
            })}
            {/* 날짜 칸 위에 겹쳐 띄움. 아래 줄에 끼우면 기록을 받은 뒤 패널 높이가 바뀜 */}
            <div
              aria-hidden={isLoading || logs.length > 0}
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 top-7 flex items-center justify-center transition-opacity duration-200",
                isLoading || logs.length > 0 ? "opacity-0" : "opacity-100",
              )}
            >
              <p className="mx-2 text-balance rounded-2xl bg-white/95 px-3 py-1.5 text-center text-xs font-medium text-stone-500 shadow-sm ring-1 ring-stone-200">
                {t("empty_month")}
              </p>
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t border-stone-100 px-3 py-2">
          <Link
            href={readingLogHref({ view: "calendar", month })}
            onClick={onClose}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900"
          >
            {t("open_calendar")}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </DockPanel>
  );
};
