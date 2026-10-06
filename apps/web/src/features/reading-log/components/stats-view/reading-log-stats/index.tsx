"use client";

import type { ReadingLog } from "@bookjeok/core";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";

import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { cn } from "@/shared/utils";

import { SeasonalTheme } from "../../../constants/ui";
import { logsInMonth } from "../../../utils/month-logs";

interface ReadingLogStatsProps {
  /** 달력이 그리고 있는 달. 다른 해를 받는 동안엔 이전 달이라 제목과 숫자가 함께 넘어간다 */
  month: Date;
  /** 그해 기록. 서버 통계와 같은 기준(기간 안 기록 수)으로 센다 */
  logs: ReadingLog[] | undefined;
  isLoading: boolean;
  theme: SeasonalTheme;
}

function AnimatedNumber({ value }: { value: number }) {
  return (
    <div className="relative inline-flex h-[1.1em] overflow-hidden items-center justify-center min-w-[0.7em]">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "60%", opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-60%", opacity: 0, filter: "blur(4px)" }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.8,
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {value}
        </motion.span>
      </AnimatePresence>
      {/* 공간 확보용 투명 텍스트 */}
      <span className="invisible">{value}</span>
    </div>
  );
}

export function ReadingLogStats({
  month,
  logs,
  isLoading,
  theme,
}: ReadingLogStatsProps) {
  const t = useTranslations("reading_log.stats");
  // 달력과 같은 그해 기록에서 세므로 달을 넘겨도 요청 없이 숫자만 굴린다
  const stats = logs && {
    monthlyCount: logsInMonth(logs, month).length,
    yearlyCount: logs.length,
  };

  const getMessage = (monthly: number) => {
    if (monthly === 0) return t("messages.start");
    if (monthly >= 5) return t("messages.great");
    if (monthly >= 3) return t("messages.good");
    return t("messages.default");
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:gap-8 mb-16 relative">
        {/* 세로 구분선 */}
        <div className="absolute left-1/2 top-4 bottom-4 w-px bg-stone-200/60 -translate-x-1/2" />

        {/* 월간 통계 스켈레톤 */}
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20 mx-auto bg-stone-100" />
            <div className="flex items-baseline justify-center gap-1">
              <Skeleton className="h-16 md:h-20 w-12 md:w-16 bg-stone-200" />
              <Skeleton className="h-3 w-6 bg-stone-100 mb-2" />
            </div>
          </div>
          <Skeleton className="h-4 w-24 bg-stone-100" />
        </div>

        {/* 연간 통계 스켈레톤 */}
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20 mx-auto bg-stone-100" />
            <div className="flex items-baseline justify-center gap-1">
              <Skeleton className="h-16 md:h-20 w-12 md:w-16 bg-stone-200" />
              <Skeleton className="h-3 w-6 bg-stone-100 mb-2" />
            </div>
          </div>
          <div className="h-4" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-8 mb-16 relative">
      {/* Vertical Divider */}
      <div className="absolute left-1/2 top-4 bottom-4 w-px bg-stone-200/60 -translate-x-1/2" />

      {/* 월간 통계 */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 group">
        <div className="space-y-1">
          <p className="text-[11px] font-bold tracking-[0.2em] text-stone-400 uppercase">
            {t("monthly_title", { month: month.getMonth() + 1 })}
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span
              className={cn(
                "text-5xl md:text-7xl font-serif font-light tracking-tight transition-colors duration-500",
                theme.activeText, // 숫자에 테마 색상 적용
              )}
            >
              <AnimatedNumber value={stats.monthlyCount} />
            </span>
            <span className="text-xs text-stone-400 font-medium self-end mb-2">
              {t("unit")}
            </span>
          </div>
        </div>

        <p
          className={cn(
            "text-xs font-medium transition-colors duration-500",
            theme.accent,
          )}
        >
          {getMessage(stats.monthlyCount)}
        </p>
      </div>

      {/* 연간 통계 */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 group">
        <div className="space-y-1">
          <p className="text-[11px] font-bold tracking-[0.2em] text-stone-400 uppercase">
            {t("yearly_title", { year: month.getFullYear() })}
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl md:text-7xl font-serif font-light tracking-tight text-stone-800 transition-colors duration-500 group-hover:text-stone-600">
              <AnimatedNumber value={stats.yearlyCount} />
            </span>
            <span className="text-xs text-stone-400 font-medium self-end mb-2">
              {t("unit")}
            </span>
          </div>
        </div>
        {/* 정렬을 위한 공간 확보 (추후 연간 메시지 추가 가능) */}
        <div className="h-4" />
      </div>
    </div>
  );
}
