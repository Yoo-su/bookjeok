"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Search, X } from "@/shared/components/icons/iconsax";
import { Input } from "@/shared/components/shadcn/input";
import { cn } from "@/shared/utils/cn";

import { useBookSearchParams } from "../../hooks/use-book-search-params";

interface StickyBookSearchBarProps {
  isVisible: boolean;
  /** 쿼리 파라미터 이름 (기본값: "q") */
  paramName?: string;
}

/**
 * 스크롤 시 나타나는 Sticky 검색바
 * - URL search params 기반으로 검색어 관리
 * - 엔터키로 검색 실행
 */
export const StickyBookSearchBar = ({
  isVisible,
  paramName = "q",
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
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-3 px-4 transition-all duration-500 ease-[0.16,1,0.3,1] transform",
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none invisible",
      )}
    >
      {/* Frosted Glass Background */}
      <div className="absolute inset-x-0 top-0 h-full bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm" />

      <div className="relative w-full max-w-xl z-10">
        <div className="relative group">
          <button
            onClick={executeSearch}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label={t("button_label")}
          >
            <Search className="w-4 h-4" />
          </button>

          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t("sticky_placeholder")}
            className="w-full pl-11 pr-10 h-11 text-base bg-white/60 border-zinc-200/50 hover:bg-white/90 focus:bg-white focus:border-zinc-300 rounded-full shadow-sm focus:shadow-md focus:ring-2 focus:ring-zinc-100 transition-all duration-300 font-light tracking-wide"
          />

          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
