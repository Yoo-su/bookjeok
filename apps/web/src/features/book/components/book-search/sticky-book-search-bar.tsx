"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";

import { Search, X } from "@/shared/components/icons/iconsax";
import { Input } from "@/shared/components/shadcn/input";
import { cn } from "@/shared/utils/cn";

import { useBookSearchParams } from "../../hooks/use-book-search-params";

interface StickyBookSearchBarProps {
  isVisible: boolean;
  /** 쿼리 파라미터 이름 (기본값: "q") */
  paramName?: string;
  top?: number;
}

/**
 * 스크롤 시 나타나는 Sticky 검색바
 * - URL search params 기반으로 검색어 관리
 * - 엔터키로 검색 실행
 */
export const StickyBookSearchBar = ({
  isVisible,
  paramName = "q",
  top = 80,
}: StickyBookSearchBarProps) => {
  const t = useTranslations("book.search");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    inputValue,
    setInputValue,
    executeSearch,
    handleKeyDown,
    handleClear: baseHandleClear,
  } = useBookSearchParams({ paramName });

  // 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // 검색어 초기화 핸들러 (포커스 이동 포함)
  const handleClear = () => {
    baseHandleClear();
    inputRef.current?.focus();
  };

  return (
    <div
      data-sticky-book-search
      role="search"
      aria-label={t("title")}
      style={{ top }}
      className={cn(
        "fixed left-0 right-0 z-40 flex items-center justify-center py-2 px-4 bg-white/95 backdrop-blur-md border-b border-stone-200 transition-[opacity,transform] duration-150 motion-reduce:transition-none",
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-2 opacity-0 pointer-events-none invisible",
      )}
    >
      <div className="relative w-full max-w-5xl">
        <div className="relative group">
          <button
            type="button"
            onClick={executeSearch}
            className="absolute left-1 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-700 active:opacity-70"
            aria-label={t("button_label")}
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>

          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t("sticky_placeholder")}
            aria-label={t("hero.placeholder")}
            style={{ fontSize: 16 }}
            className="w-full pl-11 pr-11 h-11 bg-white border-stone-300 rounded-md shadow-none focus-visible:border-stone-600 focus-visible:ring-stone-400/30 transition-none font-normal"
          />

          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={t("hero.clear")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded hover:bg-zinc-100 text-zinc-500 focus-visible:outline-2 focus-visible:outline-zinc-700 active:opacity-70"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
