"use client";

import { startOfDay } from "date-fns";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { ReadingLogCalendar } from "@/features/reading-log/components/calendar-view/reading-log-calendar";
import type { ReadingLogViewMode } from "@/features/reading-log/components/calendar-view/reading-log-controls";
import { ReadingLogHero } from "@/features/reading-log/components/common/reading-log-hero";
import { useReadingLogViewStore } from "@/features/reading-log/stores/use-reading-log-view-store";
import {
  parseReadingLogLink,
  type ReadingLogLink,
  readingLogParams,
} from "@/features/reading-log/utils/reading-log-link";
import { parseCalendarDate } from "@/shared/utils/format-date";

const DAY_ENTRY = "bookjeokReadingLogDay";

export function ReadingLogView() {
  return (
    <Suspense fallback={null}>
      <ReadingLogContent />
    </Suspense>
  );
}

function ReadingLogContent() {
  const searchParams = useSearchParams();
  const preferredView = useReadingLogViewStore((s) => s.viewMode);
  const setPreferredView = useReadingLogViewStore((s) => s.setViewMode);
  const link = parseReadingLogLink(new URLSearchParams(searchParams));
  const today = startOfDay(new Date());
  const currentDate = link?.date ?? link?.month ?? today;
  const viewMode = link?.date ? "calendar" : (link?.view ?? preferredView);
  const openDate = link?.date && link.date <= today ? link.date : null;

  const buildUrl = (next: ReadingLogLink) => {
    const url = new URL(window.location.href);
    readingLogParams(next, url.searchParams);
    return url.pathname + url.search + url.hash;
  };

  const navigate = (next: ReadingLogLink) => {
    const { pathname, search, hash } = window.location;
    const href = buildUrl(next);
    if (href === pathname + search + hash) return;
    if (!link?.date) {
      const currentHref = buildUrl({ month: currentDate, view: viewMode });
      if (currentHref !== pathname + search + hash) {
        window.history.replaceState(null, "", currentHref);
      }
    }
    window.history.pushState(
      next.date ? { [DAY_ENTRY]: true } : null,
      "",
      href,
    );
  };

  const openDay = (date: Date) => {
    navigate(
      date <= today
        ? { date, view: "calendar" }
        : { month: date, view: "calendar" },
    );
  };

  const closeDay = () => {
    if (window.history.state?.[DAY_ENTRY]) {
      window.history.back();
      return;
    }
    window.history.replaceState(
      null,
      "",
      buildUrl({ month: currentDate, view: viewMode }),
    );
  };

  const changeView = (view: ReadingLogViewMode) => {
    if (view === viewMode) return;
    navigate({ month: currentDate, view });
    setPreferredView(view);
  };

  return (
    <div className="relative min-h-dvh pb-20">
      <ReadingLogHero
        currentDate={currentDate}
        onOpenDate={(date) => openDay(parseCalendarDate(date))}
      />

      <div className="relative z-10 w-full">
        <ReadingLogCalendar
          currentDate={currentDate}
          onDateChange={(month) => navigate({ month, view: viewMode })}
          viewMode={viewMode}
          onViewModeChange={changeView}
          openDate={openDate}
          onOpenDay={openDay}
          onCloseDay={closeDay}
        />
      </div>
    </div>
  );
}
