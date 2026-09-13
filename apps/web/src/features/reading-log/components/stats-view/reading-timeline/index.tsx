"use client";

import { ReadingLog } from "@bookjeok/core";
import { format } from "date-fns";
import { motion } from "framer-motion";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChevronLeft, ChevronRight } from "@/shared/components/icons/iconsax";
import { Card } from "@/shared/components/shadcn/card";
import { formatDate, parseCalendarDate } from "@/shared/utils/format-date";

interface ReadingTimelineProps {
  logs: ReadingLog[];
}

export function ReadingTimeline({ logs }: ReadingTimelineProps) {
  const t = useTranslations("reading_log.timeline");
  const locale = useLocale();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  const groupedLogs = useMemo(() => {
    if (!logs) return {};

    const groups: Record<string, ReadingLog[]> = {};

    logs.forEach((log) => {
      // 달력 날짜라 new Date()에 그냥 넣으면 UTC 자정이 된다. UTC보다 뒤진
      // 타임존에서는 매달 1일 기록이 전월 그룹으로 밀린다.
      const date = parseCalendarDate(log.date);
      const key = format(date, "yyyy.MM");

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(log);
    });

    // 키 내림차순 정렬 (로그가 이미 정렬되어 있지만 안전을 위해)
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .reduce(
        (acc, key) => {
          acc[key] = groups[key];
          return acc;
        },
        {} as Record<string, ReadingLog[]>,
      );
  }, [logs]);

  const updateButtonVisibility = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const canScrollLeft = el.scrollLeft > 2;
    const canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;

    setShowLeftButton(canScrollLeft);
    setShowRightButton(canScrollRight);
  };

  // 가로 스크롤 감지 및 화면 리사이즈 감지
  useEffect(() => {
    updateButtonVisibility();

    const el = scrollContainerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      updateButtonVisibility();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [logs]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!logs || logs.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        <span className="text-xs text-muted-foreground">{t("subtitle")}</span>
      </div>

      <div className="relative group/timeline w-full">
        {/* 왼쪽 화살표 버튼 */}
        {showLeftButton && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-white/90 dark:bg-stone-900/90 border border-stone-200/60 dark:border-stone-850 shadow-md text-stone-600 dark:text-stone-300 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200 opacity-0 group-hover/timeline:opacity-100 hidden md:flex cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* 오른쪽 화살표 버튼 */}
        {showRightButton && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-white/90 dark:bg-stone-900/90 border border-stone-200/60 dark:border-stone-850 shadow-md text-stone-600 dark:text-stone-300 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200 opacity-0 group-hover/timeline:opacity-100 hidden md:flex cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={updateButtonVisibility}
          className="w-full overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div className="flex gap-8 py-4">
            {Object.entries(groupedLogs).map(
              ([month, monthLogs], groupIndex) => (
                <div key={month} className="flex-none flex flex-col gap-4">
                  <div className="sticky left-0 z-10">
                    <span className="text-2xl font-bold text-muted-foreground/30 select-none">
                      {month}
                    </span>
                  </div>

                  <div className="flex gap-6 px-1">
                    {monthLogs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIndex * 0.2 + index * 0.1 }}
                        className="relative pt-6"
                      >
                        {/* 타임라인 선 및 점 */}
                        <div className="absolute top-0 left-1/2 -ml-px h-6 w-[2px] bg-primary/20">
                          <div className="absolute top-0 left-1/2 -ml-[3px] h-[6px] w-[6px] rounded-full bg-primary ring-4 ring-background" />
                        </div>

                        <Card className="w-[140px] md:w-[160px] overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow group bg-card/50 hover:bg-card">
                          <div className="p-3 space-y-3">
                            <div className="relative aspect-2/3 w-full overflow-hidden rounded-md bg-muted shadow-inner">
                              {log.book?.image ? (
                                <Image
                                  src={log.book.image}
                                  alt={log.book.title}
                                  fill
                                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center bg-secondary text-muted-foreground text-xs">
                                  {t("no_image")}
                                </div>
                              )}
                            </div>

                            <div className="space-y-1 text-center">
                              <p
                                className="font-medium text-sm line-clamp-1 truncate"
                                title={log.book?.title}
                              >
                                {log.book?.title}
                              </p>
                              <p
                                className="text-xs text-muted-foreground line-clamp-1 truncate"
                                title={log.book?.author}
                              >
                                {log.book?.author}
                              </p>
                              <time className="block text-[10px] text-primary/80 font-medium pt-1">
                                {formatDate(log.date, locale, "day")}
                              </time>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
