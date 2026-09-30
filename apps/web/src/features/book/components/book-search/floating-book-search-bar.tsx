"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";

import { ArrowUp, Search, X } from "@/shared/components/icons/iconsax";
import { cn } from "@/shared/utils/cn";

import { useBookSearchParams } from "../../hooks/use-book-search-params";

/** hidden: 히어로 검색창이 보일 때, search: 스크롤 중, top: 목록 끝(맨 위로만) */
export type FloatingBookSearchMode = "hidden" | "search" | "top";

interface FloatingBookSearchBarProps {
  mode: FloatingBookSearchMode;
  /** 우하단 채팅 버튼 노출 여부. 모바일에서 그 자리를 비움 */
  hasChatButton?: boolean;
  /** 좌하단 음악 알약 노출 여부. lg 미만에서 그 위로 올림 */
  hasMusicPill?: boolean;
  /** 검색 실행 직후 호출. 결과 상단으로 스크롤할 때 사용 */
  onSearch?: () => void;
  paramName?: string;
}

/**
 * 스크롤 중 하단에 떠 있는 검색 알약
 * - 상단 헤더 알약과 겹치지 않도록 하단에 배치
 * - 맨 위로 버튼 포함. 목록 끝에서는 푸터를 가리지 않게 이 버튼만 남김
 */
export const FloatingBookSearchBar = ({
  mode,
  hasChatButton = false,
  hasMusicPill = false,
  onSearch,
  paramName = "q",
}: FloatingBookSearchBarProps) => {
  const t = useTranslations("book.search");
  const tAria = useTranslations("common.aria");
  const inputRef = useRef<HTMLInputElement>(null);

  const { inputValue, setInputValue, executeSearch, handleKeyDown } =
    useBookSearchParams({ paramName });

  const search = () => {
    executeSearch();
    inputRef.current?.blur();
    onSearch?.();
  };

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const glass =
    "rounded-full border border-stone-200/70 bg-white/90 shadow-[0_10px_40px_-12px_rgba(28,25,23,0.28)] backdrop-blur-xl transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";
  const iconButton =
    "flex shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-stone-700 active:opacity-70";

  return (
    <div
      data-floating-book-search
      className={cn(
        "pointer-events-none fixed inset-x-4 z-40 grid justify-items-center transition-[bottom] duration-300 ease-out motion-reduce:transition-none",
        // 음악 알약(bottom-6, 약 46px) 위로 한 칸
        hasMusicPill
          ? "bottom-[calc(5.25rem+env(safe-area-inset-bottom))] lg:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
          : "bottom-[calc(1.5rem+env(safe-area-inset-bottom))]",
      )}
    >
      <div
        role="search"
        aria-label={t("title")}
        // 블러와 opacity를 같은 요소에 둬야 페이드 중에도 블러가 유지됨
        className={cn(
          glass,
          "flex h-12 w-full items-center px-1.5 [grid-area:1/1] focus-within:bg-white/95 sm:w-[26rem]",
          // 채팅 버튼(right-6, 56px) 자리 비움. 음악 알약 위로 올라가면 높이가 달라 불필요
          hasChatButton &&
            !hasMusicPill &&
            "max-sm:w-[calc(100%-4.5rem)] max-sm:justify-self-start",
          mode === "search"
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "invisible translate-y-4 opacity-0",
        )}
      >
        <button
          type="button"
          onClick={search}
          aria-label={t("button_label")}
          className={cn(iconButton, "size-9")}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>

        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            handleKeyDown(e);
            if (e.key === "Enter") {
              inputRef.current?.blur();
              onSearch?.();
            }
          }}
          placeholder={t("sticky_placeholder")}
          aria-label={t("hero.placeholder")}
          // iOS 포커스 확대 방지
          className="h-full min-w-0 flex-1 bg-transparent px-1 text-base text-stone-900 outline-none placeholder:text-stone-400 [&::-webkit-search-cancel-button]:hidden"
        />

        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue("");
              inputRef.current?.focus();
            }}
            aria-label={t("hero.clear")}
            className={cn(iconButton, "size-8 text-stone-400")}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        <span className="mx-1 h-5 w-px shrink-0 bg-stone-200" aria-hidden />

        <button
          type="button"
          onClick={scrollToTop}
          aria-label={tAria("scroll_top")}
          className={cn(iconButton, "size-9")}
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={scrollToTop}
        aria-label={tAria("scroll_top")}
        // glass의 전환 목록이 iconButton의 transition-colors를 덮도록 뒤에 둠
        className={cn(
          iconButton,
          glass,
          "size-12 [grid-area:1/1] hover:bg-white",
          mode === "top"
            ? "pointer-events-auto scale-100 opacity-100"
            : "invisible scale-75 opacity-0",
        )}
      >
        <ArrowUp className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};
