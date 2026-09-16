"use client";

import { useTranslations } from "next-intl";

import { ChevronLeft, ChevronRight } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

export function ReadingLogCalendarSkeleton() {
  const t = useTranslations("reading_log.calendar.weekdays");
  const weekDayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  return (
    <div className="w-full mx-auto space-y-8">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-stone-200/50 border border-white/60 overflow-hidden ring-1 ring-stone-100">
        {/* 요일 헤더 - 단색 심플 스타일 */}
        <div className="grid grid-cols-7 border-b border-stone-100/50 bg-stone-50/50">
          {weekDayKeys.map((day) => (
            <div
              key={day}
              className="py-4 text-center text-sm font-medium text-stone-400"
            >
              {t(day)}
            </div>
          ))}
        </div>

        {/* 그리드 스켈레톤 - 심플한 박스 형태 */}
        <div className="grid grid-cols-7 auto-rows-[80px] sm:auto-rows-[160px] divide-x divide-y divide-gray-100">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="p-1 sm:p-2 flex flex-col h-full bg-white/50"
            >
              <div className="flex justify-between items-start mb-1">
                <Skeleton className="h-6 w-6 rounded-full bg-stone-50" />
              </div>

              {/* 콘텐츠 영역 단순화 */}
              <div className="flex-1 rounded-xl bg-stone-50/50 mx-1 mb-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
