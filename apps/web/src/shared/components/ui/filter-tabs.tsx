"use client";

import { motion } from "motion/react";
import { useId } from "react";

import { RollingNumber } from "@/shared/components/ui/rolling-number";
import { cn } from "@/shared/utils";

export interface FilterTab<K extends string> {
  key: K;
  label: string;
  /** 0보다 클 때만 라벨 옆에 (n)으로 표시 */
  count?: number;
}

interface FilterTabsProps<K extends string> {
  tabs: FilterTab<K>[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
}

/**
 * 목록 상단의 상태 필터 탭. 선택 표시가 탭 사이를 미끄러져 옮겨 가고,
 * 넘치면 가로로 스크롤된다.
 */
export function FilterTabs<K extends string>({
  tabs,
  value,
  onChange,
  className,
}: FilterTabsProps<K>) {
  const layoutId = `filter-tab-${useId()}`;

  return (
    <div
      className={cn(
        "border-b border-stone-200 dark:border-stone-800",
        className,
      )}
    >
      <motion.div
        layoutScroll
        className="hide-scrollbars flex gap-1 overflow-x-auto pb-2"
      >
        {tabs.map((tab) => {
          const isActive = value === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              aria-pressed={isActive}
              onClick={(event) => {
                // 좁은 화면에서 반쯤 잘린 탭을 누르면 전부 보이게 당겨 온다
                event.currentTarget.scrollIntoView?.({
                  behavior: "smooth",
                  block: "nearest",
                  inline: "nearest",
                });
                onChange(tab.key);
              }}
              className={cn(
                "relative whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
                isActive
                  ? "text-white dark:text-stone-900"
                  : "text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-lg bg-stone-900 dark:bg-stone-100 shadow-2xs"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative">
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      "ml-1 text-[11px] font-mono",
                      isActive ? "opacity-90" : "text-stone-400",
                    )}
                  >
                    (<RollingNumber value={tab.count} />)
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
