"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export type SearchMode = "KEYWORD" | "AI";

interface SearchModeTabsProps {
  activeMode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}

export const SearchModeTabs = ({
  activeMode,
  onModeChange,
}: SearchModeTabsProps) => {
  const t = useTranslations("book.search");

  return (
    <div className="max-w-2xl mx-auto w-full mb-6">
      <div
        role="tablist"
        aria-label={t("title")}
        className="p-1 bg-stone-100/90 rounded-2xl border border-stone-200/80 grid grid-cols-2 gap-1 shadow-2xs"
      >
        <button
          type="button"
          role="tab"
          id="tab-keyword"
          aria-selected={activeMode === "KEYWORD"}
          onClick={() => onModeChange("KEYWORD")}
          className={`relative py-2.5 text-xs sm:text-sm font-medium transition-colors duration-200 rounded-xl select-none cursor-pointer text-center outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
            activeMode === "KEYWORD"
              ? "text-stone-900 font-semibold"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          {activeMode === "KEYWORD" && (
            <motion.div
              layoutId="activeSearchTab"
              className="absolute inset-0 bg-white rounded-xl shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{t("tab_keyword")}</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-ai"
          aria-selected={activeMode === "AI"}
          onClick={() => onModeChange("AI")}
          className={`relative py-2.5 text-xs sm:text-sm font-medium transition-colors duration-200 rounded-xl select-none cursor-pointer text-center outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
            activeMode === "AI"
              ? "text-stone-900 font-semibold"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          {activeMode === "AI" && (
            <motion.div
              layoutId="activeSearchTab"
              className="absolute inset-0 bg-white rounded-xl shadow-xs"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{t("tab_ai")}</span>
        </button>
      </div>
    </div>
  );
};
