"use client";

import { useTranslations } from "next-intl";

import { Skeleton } from "@/shared/components/shadcn/skeleton";

export function ReadingLogCalendarSkeleton() {
  const t = useTranslations("reading_log.calendar.weekdays");
  const weekDayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  return (
    <div className="w-full mx-auto space-y-8">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-stone-200/50 border border-white/60 overflow-hidden ring-1 ring-stone-100">
        {/* 요일 헤더 - 단색 심플 스타일 */}
        <div className="grid grid-cols-7 gap-1 px-2 border-b border-stone-100/50 bg-stone-50/50 sm:gap-0 sm:px-0">
          {weekDayKeys.map((day) => (
            <div
              key={day}
              className="py-2.5 text-center text-xs font-medium text-stone-400 sm:py-4 sm:text-sm"
            >
              {t(day)}
            </div>
          ))}
        </div>

        {/* 실제 달력과 같은 배치. 모바일은 표지 칸, sm 이상은 선으로 나눈 표 */}
        <div className="grid grid-cols-7 gap-1 p-2 sm:auto-rows-[160px] sm:gap-0 sm:p-0 sm:divide-x sm:divide-y sm:divide-gray-100">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-md bg-stone-50 sm:flex sm:aspect-auto sm:h-full sm:flex-col sm:rounded-none sm:bg-white/50 sm:p-2"
            >
              <div className="hidden sm:contents">
                <div className="flex justify-between items-start mb-1">
                  <Skeleton className="h-6 w-6 rounded-full bg-stone-50" />
                </div>

                {/* 콘텐츠 영역 단순화 */}
                <div className="flex-1 rounded-xl bg-stone-50/50 mx-1 mb-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
