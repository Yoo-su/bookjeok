"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { ChevronDown, Search, X } from "@/shared/components/icons/iconsax";
import { cn } from "@/shared/utils/cn";

import { useBookSearchParams } from "../../hooks/use-book-search-params";

/** dock이 펼쳐질 때 바로 포커스를 주기 위한 표식 */
export const DOCK_SEARCH_INPUT_ATTR = "data-dock-search-input";

/** 검색 결과 목록 최상단 표식. 검색 후 이 위치로 스크롤 */
export const BOOK_SEARCH_RESULTS_ATTR = "data-book-search-results";

interface DockBookSearchFieldProps {
  /** 검색 실행·Esc·바깥 클릭 시 호출. dock을 접음 */
  onClose: () => void;
}

const scrollToResults = () => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  document.querySelector(`[${BOOK_SEARCH_RESULTS_ATTR}]`)?.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
};

/** 사파리는 버튼을 눌러도 포커스를 옮기지 않아 blur가 먼저 접어 버림. 입력창에 포커스 유지 */
const keepInputFocus = (e: React.MouseEvent) => e.preventDefault();

const iconButton =
  "flex size-9 shrink-0 items-center justify-center rounded-full text-stone-500 transition-[background-color,color,scale] duration-150 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-stone-700 active:scale-90";

/** 하단 dock 안에서 펼쳐지는 검색 입력창. 검색 결과 화면 전용 */
export const DockBookSearchField = ({ onClose }: DockBookSearchFieldProps) => {
  const t = useTranslations("book.search");
  const tAria = useTranslations("common.aria");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { inputValue, setInputValue, executeSearch } = useBookSearchParams();

  // iOS는 빈 곳을 눌러도 입력창 포커스를 풀지 않아 바깥 누름을 직접 감지
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onClose]);

  const search = () => {
    executeSearch();
    inputRef.current?.blur();
    onClose();
    scrollToResults();
  };

  return (
    <div
      ref={rootRef}
      role="search"
      aria-label={t("title")}
      // 포커스가 필드 밖으로 나가면 접음
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) {
          onClose();
        }
      }}
      className="flex h-11 w-full items-center"
    >
      <button
        type="button"
        onMouseDown={keepInputFocus}
        onClick={search}
        aria-label={t("button_label")}
        className={iconButton}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>

      <input
        ref={inputRef}
        {...{ [DOCK_SEARCH_INPUT_ATTR]: "" }}
        type="search"
        enterKeyHint="search"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            search();
          } else if (e.key === "Escape") {
            onClose();
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
          onMouseDown={keepInputFocus}
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
        onMouseDown={keepInputFocus}
        onClick={onClose}
        aria-label={tAria("close")}
        className={iconButton}
      >
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};
