"use client";

import { useState } from "react";

import { ReadingLogCalendar } from "@/features/reading-log/components/calendar-view/reading-log-calendar";
import { ReadingLogHero } from "@/features/reading-log/components/common/reading-log-hero";

export function ReadingLogView() {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="relative min-h-dvh pb-20">
      <ReadingLogHero currentDate={currentDate} />

      <div className="relative z-10 w-full">
        <ReadingLogCalendar
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />
      </div>
    </div>
  );
}
