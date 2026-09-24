"use client";

import { setMonth, setYear } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { ChevronLeft, ChevronRight } from "@/shared/components/icons/iconsax";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/shadcn/select";
import { cn } from "@/shared/utils";

export type ReadingLogViewMode = "calendar" | "list";

interface ReadingLogControlsProps {
  viewMode: ReadingLogViewMode;
  onViewModeChange: (mode: ReadingLogViewMode) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function ReadingLogControls({
  viewMode,
  onViewModeChange,
  currentDate,
  onDateChange,
  onPrevMonth,
  onNextMonth,
  isLoading,
  readOnly = false,
}: ReadingLogControlsProps) {
  const t = useTranslations("reading_log.controls");
  const tCalendar = useTranslations("reading_log.calendar");
  // 연도 선택 옵션 생성 (현재 연도 + 1 년 동안 2020년까지)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2020 + 2 },
    (_, i) => currentYear + 1 - i,
  );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleYearChange = (yearStr: string) => {
    onDateChange(setYear(currentDate, parseInt(yearStr)));
  };

  const handleMonthChange = (monthStr: string) => {
    onDateChange(setMonth(currentDate, parseInt(monthStr) - 1));
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
      {/* 날짜 네비게이션 */}
      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
        {viewMode === "calendar" ? (
          <>
            <div className="flex items-center gap-4">
              {/* 이전 달 버튼 */}
              <button
                onClick={onPrevMonth}
                disabled={isLoading}
                className="group p-2 rounded-full hover:bg-stone-100 transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5 text-stone-400 group-hover:text-stone-900 transition-colors" />
              </button>

              {/* 날짜 선택 (숨겨진 Select, 보이는 텍스트) */}
              <div className="flex items-baseline gap-2 relative group cursor-pointer overflow-hidden">
                {/* 시각적 텍스트 표시 */}
                <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 tracking-tight flex items-baseline">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={currentDate.getMonth()}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="inline-block min-w-[1.4em] text-center"
                    >
                      {currentDate.getMonth() + 1}
                    </motion.span>
                  </AnimatePresence>

                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={currentDate.getFullYear()}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="ml-2 text-stone-400 font-light inline-block"
                    >
                      {currentDate.getFullYear()}
                    </motion.span>
                  </AnimatePresence>
                </h2>

                {/* 기능을 위해 텍스트 위에 덮어씌운 투명 Select 트리거 */}
                <div className="absolute inset-0 flex opacity-0 z-10">
                  <Select
                    value={currentDate.getFullYear().toString()}
                    onValueChange={handleYearChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="flex-1 h-full w-full border-none p-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={(currentDate.getMonth() + 1).toString()}
                    onValueChange={handleMonthChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="flex-1 h-full w-full border-none p-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m} value={m.toString()}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 다음 달 버튼 */}
              <button
                onClick={onNextMonth}
                disabled={isLoading}
                className="group p-2 rounded-full hover:bg-stone-100 transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-stone-900 transition-colors" />
              </button>
            </div>
          </>
        ) : (
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-stone-900 tracking-tight">
            {t("all_logs")}
          </h2>
        )}
      </div>

      {/* 뷰 모드 토글 (캘린더/리스트) */}
      {!readOnly && (
        <div className="flex items-center gap-6">
          <button
            onClick={() => onViewModeChange("calendar")}
            className={cn(
              "text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 relative py-1",
              viewMode === "calendar"
                ? "text-stone-900"
                : "text-stone-400 hover:text-stone-600",
            )}
          >
            {t("view_calendar")}
            {viewMode === "calendar" && (
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-stone-900 animate-in fade-in zoom-in duration-300" />
            )}
          </button>

          <div className="w-px h-3 bg-stone-200" />

          <button
            onClick={() => onViewModeChange("list")}
            className={cn(
              "text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 relative py-1",
              viewMode === "list"
                ? "text-stone-900"
                : "text-stone-400 hover:text-stone-600",
            )}
          >
            {t("view_list")}
            {viewMode === "list" && (
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-stone-900 animate-in fade-in zoom-in duration-300" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
