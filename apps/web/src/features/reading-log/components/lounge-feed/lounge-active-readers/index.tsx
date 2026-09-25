"use client";

import { useLoungeActiveReadersQuery } from "@bookjeok/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ReaderRow } from "./reader-row";
import { LoungeActiveReadersSkeleton } from "./skeleton";

const COLLAPSED_COUNT = 3;
const MAX_COUNT = 10;

export function LoungeActiveReaders() {
  const t = useTranslations("lounge.active_readers");
  const { data, isLoading } = useLoungeActiveReadersQuery();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return <LoungeActiveReadersSkeleton />;
  }

  if (!data || !data.items || data.items.length === 0) {
    return null;
  }

  const allItems = data.items.slice(0, MAX_COUNT);
  const topItems = allItems.slice(0, COLLAPSED_COUNT);
  const expandableItems = allItems.slice(COLLAPSED_COUNT);
  const hasExpandable = expandableItems.length > 0;

  return (
    <section>
      {/* 섹션 헤더 */}
      <div className="mb-6 border-b border-stone-200 pb-5">
        <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 font-medium tracking-tight">
          {t("title")}
        </h2>
        <p className="mt-2 text-sm sm:text-base text-stone-500 font-light">
          {t("subtitle")}
        </p>
      </div>

      {/* 상위 1~3위: 항상 노출 */}
      <div className="flex flex-col border-t border-stone-200/80">
        {topItems.map((item, idx) => (
          <ReaderRow key={item.user.id} item={item} rank={idx + 1} />
        ))}
      </div>

      {/* 4~10위: 접기/펼치기 애니메이션 영역 */}
      <AnimatePresence initial={false}>
        {isExpanded && hasExpandable && (
          <motion.div
            key="expandable-readers"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: {
                height: "auto",
                opacity: 1,
                transition: {
                  height: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
                  opacity: { duration: 0.25 },
                  staggerChildren: 0.05,
                  delayChildren: 0.02,
                },
              },
              collapsed: {
                height: 0,
                opacity: 0,
                transition: {
                  height: { duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] },
                  opacity: { duration: 0.2 },
                  staggerChildren: 0.03,
                  staggerDirection: -1,
                },
              },
            }}
            className="overflow-hidden"
          >
            <div>
              {expandableItems.map((item, idx) => (
                <motion.div
                  key={item.user.id}
                  variants={{
                    open: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 26,
                      },
                    },
                    collapsed: {
                      opacity: 0,
                      y: 12,
                      transition: { duration: 0.2 },
                    },
                  }}
                >
                  <ReaderRow item={item} rank={COLLAPSED_COUNT + idx + 1} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 접기/펼치기 버튼 */}
      {hasExpandable && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-6 py-2.5 rounded-full border border-stone-200 text-stone-600 text-xs sm:text-sm font-medium hover:bg-stone-50 hover:text-stone-800 hover:border-stone-300 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1"
          >
            <span>{isExpanded ? t("collapse") : t("more")}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
