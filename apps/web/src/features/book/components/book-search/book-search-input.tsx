"use client";

import { useTranslations } from "next-intl";

import { Search } from "@/shared/components/icons/iconsax";
import { Input } from "@/shared/components/shadcn/input";

import { useBookSearchParams } from "../../hooks/use-book-search-params";
import styles from "./search-hero.module.css";

interface BookSearchInputProps {
  /** 쿼리 파라미터 이름 (기본값: "q") */
  paramName?: string;
  /** 맞춤 플레이스홀더 (기본값: t("placeholder")) */
  placeholder?: string;
  variant?: "default" | "hero";
}

/**
 * 도서 검색 인풋 컴포넌트
 * - URL search params 기반으로 검색어 관리
 * - 엔터키 또는 검색 버튼 클릭 시 검색 실행
 */
export const BookSearchInput = ({
  paramName = "q",
  placeholder,
  variant = "default",
}: BookSearchInputProps) => {
  const t = useTranslations("book.search");
  const isHero = variant === "hero";
  const inputPlaceholder =
    placeholder || t(isHero ? "hero.placeholder" : "placeholder");

  const { inputValue, setInputValue, executeSearch, handleKeyDown } =
    useBookSearchParams({ paramName });

  // 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div
      className={
        isHero ? styles.inputWrapper : "relative mb-8 max-w-2xl mx-auto w-full"
      }
    >
      <div className={isHero ? styles.inputGroup : "relative group"}>
        {!isHero && (
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-zinc-600 transition-colors pointer-events-none"
            aria-hidden="true"
          />
        )}

        <Input
          type={isHero ? "search" : "text"}
          enterKeyHint="search"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={inputPlaceholder}
          aria-label={inputPlaceholder}
          className={
            isHero
              ? styles.searchInput
              : "w-full pl-14 pr-16 h-16 text-lg font-light tracking-wide bg-white border border-zinc-200 rounded-full shadow-xl shadow-zinc-200/40 focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100 transition-all duration-300 placeholder:text-zinc-400"
          }
        />

        {!isHero && (
          <button
            type="button"
            onClick={executeSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center cursor-pointer"
            aria-label={t("button_label")}
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
