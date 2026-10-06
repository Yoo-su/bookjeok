"use client";

import { startOfDay, startOfMonth } from "date-fns";
import { Suspense, useCallback, useState } from "react";

import { ReadingLogCalendar } from "@/features/reading-log/components/calendar-view/reading-log-calendar";
import { ReadingLogHero } from "@/features/reading-log/components/common/reading-log-hero";
import { useReadingLogViewStore } from "@/features/reading-log/stores/use-reading-log-view-store";
import type { ReadingLogLink } from "@/features/reading-log/utils/reading-log-link";
import { parseCalendarDate } from "@/shared/utils/format-date";

import { ReadingLogDeepLink } from "./reading-log-deep-link";

export function ReadingLogView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  // 딥링크로 받은 날짜. 그 달 기록을 받은 뒤 상세를 띄우고 비움
  const [openDate, setOpenDate] = useState<Date | null>(null);
  const viewMode = useReadingLogViewStore((s) => s.viewMode);
  const setViewMode = useReadingLogViewStore((s) => s.setViewMode);

  const applyLink = useCallback(
    ({ date, month, view }: ReadingLogLink) => {
      if (date) {
        setViewMode("calendar");
        setCurrentDate(date);
        // 미래 날짜는 기록할 수 없어 상세를 띄우지 않음
        if (date <= startOfDay(new Date())) setOpenDate(date);
        return;
      }
      if (view) setViewMode(view);
      if (month) setCurrentDate(startOfMonth(month));
    },
    [setViewMode],
  );

  return (
    <div className="relative min-h-dvh pb-20">
      <Suspense fallback={null}>
        <ReadingLogDeepLink onApply={applyLink} />
      </Suspense>
      <ReadingLogHero
        currentDate={currentDate}
        onOpenDate={(date) => applyLink({ date: parseCalendarDate(date) })}
      />

      <div className="relative z-10 w-full">
        <ReadingLogCalendar
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          openDate={openDate}
          onOpenDateHandled={() => setOpenDate(null)}
        />
      </div>
    </div>
  );
}
