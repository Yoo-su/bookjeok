"use client";

import { BOOK_DOMAINS, CATEGORY_MAP } from "@bookjeok/core";
import { useTranslations } from "next-intl";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { cn } from "@/shared/utils";

import { BookFilterChip } from "./book-filter-chip";

interface ReviewHomeFiltersProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  isFiltered: boolean;
  clearFilters: () => void;
  selectedCategory: string | null;
  handleCategoryClick: (category: string) => void;
  /** URL의 tag 파라미터. 태그 필터가 걸리지 않았으면 null */
  selectedTag: string | null;
  clearTag: () => void;
  /** URL의 isbn 파라미터. 도서 필터가 걸리지 않았으면 null */
  selectedIsbn: string | null;
  clearIsbn: () => void;
}

// 리뷰 홈 검색/카테고리 필터 컴포넌트
export function ReviewHomeFilters({
  searchInput,
  setSearchInput,
  handleSearch,
  isFiltered,
  clearFilters,
  selectedCategory,
  handleCategoryClick,
  selectedTag,
  clearTag,
  selectedIsbn,
  clearIsbn,
}: ReviewHomeFiltersProps) {
  const t = useTranslations("review.filters");
  const tAria = useTranslations("common.aria");

  return (
    <section className="container mx-auto mb-12 space-y-8">
      {/* 검색 영역 */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder={t("placeholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-11 pl-4 pr-10 text-base text-stone-700 md:text-sm bg-transparent border-b border-stone-200 focus:border-stone-500 focus:outline-none transition-colors duration-300 placeholder:text-stone-300 font-light"
          />
          <button
            type="submit"
            className="absolute right-0 top-1/2 -translate-y-1/2 px-3 h-full text-stone-400 hover:text-stone-600 transition-colors"
          >
            <span className="text-sm">↵</span>
          </button>
        </form>

        {isFiltered && (
          <button
            onClick={clearFilters}
            className="shrink-0 text-xs text-stone-400 hover:text-stone-600 font-light border-b border-stone-200 pb-0.5 transition-colors duration-200"
          >
            {t("reset")}
          </button>
        )}
      </div>

      {/* 태그·도서 필터 - 해당 링크로 진입했을 때만 노출 */}
      {(selectedTag || selectedIsbn) && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedIsbn && (
            <BookFilterChip isbn={selectedIsbn} onClear={clearIsbn} />
          )}
          {selectedTag && (
            <button
              onClick={clearTag}
              aria-label={tAria("tag_filter_clear", { tag: selectedTag })}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-3 py-1 text-xs font-light text-stone-600 hover:border-stone-500 hover:text-stone-900 transition-colors duration-200 cursor-pointer"
            >
              <span className="font-serif italic text-stone-400">#</span>
              <span>{selectedTag}</span>
              <span aria-hidden="true" className="text-stone-400">
                ✕
              </span>
            </button>
          )}
        </div>
      )}

      {/* 카테고리 필터 - 미니멀 텍스트 탭 */}
      <div className="w-full">
        <Swiper
          modules={[FreeMode]}
          spaceBetween={0}
          slidesPerView="auto"
          freeMode={true}
          className="w-full"
        >
          {BOOK_DOMAINS.map((category) => (
            <SwiperSlide key={category} className="w-auto! select-none">
              <button
                onClick={() => handleCategoryClick(category)}
                className={cn(
                  "px-4 py-2 text-sm cursor-pointer transition-all duration-200 relative",
                  selectedCategory === category
                    ? "text-stone-900 font-medium"
                    : "text-stone-400 hover:text-stone-600 font-light",
                )}
              >
                {t(`categories.${CATEGORY_MAP[category]}`)}
                {selectedCategory === category && (
                  <span className="absolute bottom-0 left-4 right-4 h-px bg-stone-900" />
                )}
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
