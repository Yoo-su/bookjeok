"use client";

import type { ReadingLog } from "@bookjeok/core";
import { isToday } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/shared/config/i18n/routing";
import { cn } from "@/shared/utils/cn";

import { PLANT_COVER, useJustPlanted } from "../../../hooks/use-just-planted";
import { KongFigure } from "../../kong/kong-figure";

interface CoverDayCellProps {
  day: Date;
  logs: ReadingLog[];
  /** 그날 기록들이 받은 콩. 표지 오른쪽 위에 콩 한 알을 얹는다 */
  kongCount?: number;
  isFuture: boolean;
  isLoading?: boolean;
  /** 있으면 링크(dock 패널), 없으면 버튼(독서기록 페이지) */
  href?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * 표지가 칸을 꽉 채우는 달력 칸. dock 달력 패널과 독서기록 페이지(모바일)가 함께 씀
 * - 날짜는 표지 위에 얹어 좁은 화면에서도 표지를 크게 보임
 */
export const CoverDayCell = ({
  day,
  logs,
  kongCount = 0,
  isFuture,
  isLoading = false,
  href,
  onClick,
  className,
}: CoverDayCellProps) => {
  const t = useTranslations("reading_log.peek");
  const tKong = useTranslations("kong.badge");
  const first = logs[0];
  const extra = logs.length - 1;
  const today = isToday(day);
  const planted = useJustPlanted(logs, isLoading);

  const cellClass = cn(
    "relative aspect-[3/4] overflow-hidden rounded-md",
    className,
  );
  // 표지 테두리(ring-1)보다 뒤에 붙여야 오늘 표시가 이김
  const todayRing = today && "ring-2 ring-emerald-600 ring-offset-1";
  // 표지 위에서도 읽히게 흰 바탕을 깔아 날짜를 얹음
  const dateBadge = (
    <span
      className={cn(
        "absolute left-0.5 top-0.5 z-[1] rounded px-1 text-[10px] font-bold leading-4 tabular-nums",
        first
          ? "bg-white/90 text-stone-800 shadow-sm"
          : today
            ? "text-emerald-700"
            : isFuture
              ? "text-stone-300"
              : "text-stone-500",
      )}
    >
      {day.getDate()}
    </span>
  );

  if (isFuture) {
    return (
      <span className={cn(cellClass, "bg-stone-50/60", todayRing)}>
        {dateBadge}
      </span>
    );
  }

  const dayLabel = logs.length
    ? t("day_label_books", {
        month: day.getMonth() + 1,
        day: day.getDate(),
        count: logs.length,
      })
    : t("day_label", { month: day.getMonth() + 1, day: day.getDate() });
  const label =
    kongCount > 0
      ? `${dayLabel}, ${tKong("aria", { count: kongCount })}`
      : dayLabel;

  const interactiveClass = cn(
    cellClass,
    "block outline-none transition-transform focus-visible:ring-2 focus-visible:ring-stone-700 active:scale-95",
    first
      ? "bg-stone-100 shadow-sm ring-1 ring-black/5 pointer-fine:hover:-translate-y-0.5"
      : "bg-stone-50 hover:bg-stone-100",
    isLoading && "animate-pulse",
    todayRing,
  );

  const content = (
    <>
      {dateBadge}
      {/* 달 넘김 그리드의 AnimatePresence(initial=false)가 안쪽 표지의 등장까지 막으므로 새로 둔다. 움직일지는 표지의 initial이 정함 */}
      <AnimatePresence>
        {first && (
          <motion.span
            key={first.id}
            initial={planted ? PLANT_COVER.initial : false}
            animate={PLANT_COVER.animate}
            transition={PLANT_COVER.transition}
            className="absolute inset-0"
          >
            <Image
              src={first.book.image}
              alt=""
              fill
              // 페이지·패널 달력이 같은 주소라 브라우저 캐시를 함께 씀
              unoptimized
              className="object-cover"
            />
          </motion.span>
        )}
      </AnimatePresence>
      {extra > 0 && (
        <span className="absolute bottom-0.5 right-0.5 rounded bg-stone-900/85 px-1 text-[10px] font-bold leading-4 tabular-nums text-white">
          +{extra}
        </span>
      )}
      {kongCount > 0 && (
        // 표지 위에서도 보이게 흰 테두리를 두른다
        <span className="absolute right-0.5 top-0.5 z-[1] drop-shadow-[0_0_1.5px_#fff]">
          <KongFigure size={14} />
        </span>
      )}
    </>
  );

  const title = logs.map((l) => l.book.title).join(", ") || undefined;

  return href ? (
    <Link
      href={href}
      onClick={onClick}
      aria-label={label}
      title={title}
      className={interactiveClass}
    >
      {content}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={title}
      className={cn(interactiveClass, "w-full")}
    >
      {content}
    </button>
  );
};
