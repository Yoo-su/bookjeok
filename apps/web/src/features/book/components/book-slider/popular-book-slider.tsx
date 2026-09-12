"use client";

import { usePopularBooksQuery } from "@bookjeok/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ArrowRight, ChevronRight } from "@/shared/components/icons/iconsax";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

/**
 * 지금 인기많은 책 컴포넌트
 * - 1위: #2C2C2C 다크 스포트라이트 카드 (2~7위 호버 시 부드러운 크로스페이드 프리뷰 지원)
 * - 2위 & 3위: 정갈한 직각 듀오 벤토 카드
 * - 4~7위: 에디토리얼 인덱스 랭킹 리스트
 */
export const PopularBookSlider = () => {
  const t = useTranslations("home.sections.popular_books");
  const tSlider = useTranslations("book.slider");
  const { data: books, isLoading, isError } = usePopularBooksQuery();
  const [hoveredBook, setHoveredBook] = useState<
    NonNullable<typeof books>[number] | null
  >(null);

  if (isLoading) {
    return <PopularBookSliderSkeleton />;
  }

  if (isError || !Array.isArray(books) || books.length === 0) {
    return null;
  }

  const topBook = books[0];
  const secondaryBooks = books.slice(1, 3);
  const chartBooks = books.slice(3, 7);

  // 현재 스포트라이트에 표시될 도서 (호버 중인 도서 우선, 없으면 1위 도서)
  const activeBook = hoveredBook || topBook;
  const activeIndex = books.findIndex((b) => b.isbn === activeBook.isbn);
  const activeRank = String(activeIndex >= 0 ? activeIndex + 1 : 1).padStart(
    2,
    "0",
  );

  return (
    <section className="w-full py-16 bg-white">
      <div className="w-full mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-10 flex items-end">
          <div className="flex justify-between items-end w-full">
            <div className="border-l-[3px] border-[#242424] pl-5 sm:pl-6">
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-medium text-neutral-900 tracking-tight break-keep">
                {t("title")}
              </h2>
              <p className="text-sm sm:text-base text-neutral-500 font-light mt-2 max-w-md break-keep">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* 벤토 그리드 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          {/* 1위 스포트라이트 카드 */}
          {activeBook && (
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="lg:col-span-5 flex"
            >
              <Link
                href={PATHS.BOOK_DETAIL(activeBook.isbn)}
                prefetch={false}
                className="w-full p-5 sm:p-7 lg:p-8 bg-[#2C2C2C] text-white flex flex-col justify-between group border border-neutral-800 shadow-xs hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.35)] transition-shadow duration-300 relative overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeBook.isbn}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="flex flex-col justify-between h-full"
                  >
                    <div>
                      {/* 상단 랭킹 및 출판사 */}
                      <div className="flex items-center justify-between border-b border-neutral-700/80 pb-3 sm:pb-4 mb-4 sm:mb-6">
                        <div className="flex items-center gap-2.5">
                          <span className="font-sans text-2xl sm:text-3xl font-black text-white leading-none">
                            {activeRank}
                          </span>
                          {hoveredBook && (
                            <span className="text-[10px] sm:text-[11px] font-sans px-2 py-0.5 bg-neutral-700/60 text-neutral-300 tracking-tight">
                              {tSlider("preview")}
                            </span>
                          )}
                        </div>
                        {activeBook.publisher && (
                          <span className="text-xs font-sans text-neutral-400 truncate max-w-[130px] sm:max-w-[150px]">
                            {activeBook.publisher}
                          </span>
                        )}
                      </div>

                      {/* 도서 정보 */}
                      <div className="flex gap-4 sm:gap-6 items-start">
                        <div className="w-24 sm:w-32 lg:w-36 shrink-0 aspect-2/3 overflow-hidden bg-neutral-800 border border-neutral-700 shadow-md relative">
                          <Image
                            src={activeBook.image || "/placeholder.jpg"}
                            alt={activeBook.title}
                            fill
                            sizes="(max-width: 640px) 96px, (max-width: 1024px) 128px, 144px"
                            priority
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                          />
                        </div>

                        <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1">
                          {activeBook.author && (
                            <span className="text-[11px] sm:text-xs text-neutral-400 font-sans block truncate">
                              {activeBook.author}
                            </span>
                          )}
                          <h3 className="font-serif text-lg sm:text-xl lg:text-2xl font-bold leading-snug text-neutral-100 group-hover:text-neutral-200 transition-colors line-clamp-2">
                            {activeBook.title}
                          </h3>
                          {activeBook.description && (
                            <p className="text-xs text-neutral-400 font-light leading-relaxed line-clamp-3 sm:line-clamp-4 mt-1.5 sm:mt-2 font-serif">
                              {activeBook.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-neutral-700/80 flex items-center justify-between text-xs text-neutral-400">
                      <span className="text-neutral-400 font-light truncate max-w-[60%]">
                        {activeBook.author
                          ? tSlider("author_suffix", {
                              author: activeBook.author,
                            })
                          : ""}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-neutral-300 group-hover:text-white font-medium shrink-0 ml-2">
                        {tSlider("view_detail")}{" "}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300 ease-out" />
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </Link>
            </motion.div>
          )}

          {/* 2위, 3위 도서 */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
            {secondaryBooks.map((book, idx) => {
              const rank = idx === 0 ? "02" : "03";
              const isSelected = activeBook.isbn === book.isbn;
              return (
                <motion.div
                  key={book.isbn}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="flex-1 flex"
                  onMouseEnter={() => setHoveredBook(book)}
                  onMouseLeave={() => setHoveredBook(null)}
                >
                  <Link
                    href={PATHS.BOOK_DETAIL(book.isbn)}
                    prefetch={false}
                    className={`flex-1 p-4 sm:p-5 border transition-all duration-200 flex gap-3.5 sm:gap-4 items-center group w-full ${
                      isSelected
                        ? "bg-white border-neutral-400 shadow-md"
                        : "bg-[#fafafa] border-neutral-200 shadow-xs hover:border-neutral-300"
                    }`}
                  >
                    <div className="relative w-16 sm:w-20 lg:w-22 aspect-2/3 shrink-0 overflow-hidden bg-neutral-100 border border-neutral-300">
                      <Image
                        src={book.image || "/placeholder.jpg"}
                        alt={book.title}
                        fill
                        sizes="88px"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                      <span className="absolute top-0 left-0 px-1.5 py-0.5 bg-[#2C2C2C] text-white text-[10px] font-sans font-bold">
                        {rank}
                      </span>
                    </div>
                    <div className="min-w-0 space-y-1">
                      <span className="text-[11px] font-sans text-neutral-400 block truncate">
                        {book.author}
                      </span>
                      <h4 className="font-serif text-sm sm:text-base font-bold text-neutral-900 group-hover:text-neutral-600 transition-colors line-clamp-2 leading-snug">
                        {book.title}
                      </h4>
                      {book.publisher && (
                        <p className="text-xs text-neutral-500 font-light truncate">
                          {book.publisher}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* 4~7위 도서 */}
          <div className="lg:col-span-4 p-4 sm:p-6 bg-[#fafafa] border border-neutral-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-2">
                <span className="text-xs font-sans font-semibold text-neutral-600 uppercase tracking-wider">
                  04 — 07
                </span>
                <span className="text-[11px] font-sans text-neutral-400">
                  {tSlider("popular_rank")}
                </span>
              </div>

              <div className="divide-y divide-neutral-200">
                {chartBooks.map((book, idx) => {
                  const rankNumber = String(idx + 4).padStart(2, "0");
                  const isSelected = activeBook.isbn === book.isbn;
                  return (
                    <motion.div
                      key={book.isbn}
                      whileHover={{ x: 4 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                      onMouseEnter={() => setHoveredBook(book)}
                      onMouseLeave={() => setHoveredBook(null)}
                    >
                      <Link
                        href={PATHS.BOOK_DETAIL(book.isbn)}
                        prefetch={false}
                        className={`py-2.5 sm:py-3 flex items-center justify-between gap-3 group px-2 transition-all ${
                          isSelected
                            ? "bg-white text-neutral-950 font-medium"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                          <span
                            className={`font-sans text-base sm:text-lg w-5 shrink-0 transition-colors ${
                              isSelected
                                ? "font-black text-neutral-950"
                                : "font-bold text-neutral-400 group-hover:text-neutral-900"
                            }`}
                          >
                            {rankNumber}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={`font-serif text-xs sm:text-sm truncate transition-colors ${
                                isSelected
                                  ? "text-neutral-950 font-semibold"
                                  : "text-neutral-800 group-hover:text-neutral-950"
                              }`}
                            >
                              {book.title}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate">
                              {book.author}
                              {book.publisher ? ` · ${book.publisher}` : ""}
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 transition-all duration-200 shrink-0 ${
                            isSelected
                              ? "text-neutral-800 translate-x-1"
                              : "text-neutral-300 group-hover:text-neutral-700 group-hover:translate-x-1"
                          }`}
                        />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 sm:pt-4 border-t border-neutral-200 mt-2">
              <Link
                href={PATHS.BOOK_SEARCH}
                className="block w-full py-2.5 text-xs text-center font-medium text-neutral-700 bg-white hover:text-neutral-950 border border-neutral-200 shadow-2xs hover:shadow-xs transition-all"
              >
                {tSlider("find_more")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * 벤토 레이아웃 스켈레톤
 */
const PopularBookSliderSkeleton = () => {
  return (
    <section className="w-full py-16 bg-white">
      <div className="w-full mx-auto px-4">
        {/* 헤더 스켈레톤 */}
        <div className="mb-10 flex items-end gap-4 animate-pulse">
          <Skeleton className="h-16 w-24 bg-neutral-100" />
          <div className="pb-1 space-y-1.5">
            <Skeleton className="h-5 w-32 bg-neutral-100" />
            <Skeleton className="h-3 w-48 bg-neutral-50" />
          </div>
        </div>

        {/* 벤토 그리드 스켈레톤 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch animate-pulse">
          {/* 1위 카드 스켈레톤 */}
          <div className="lg:col-span-5 p-7 sm:p-8 bg-neutral-900 border border-neutral-800 flex flex-col justify-between min-h-[320px]">
            <div>
              <div className="flex justify-between border-b border-neutral-800 pb-4 mb-6">
                <Skeleton className="h-8 w-12 bg-neutral-800" />
                <Skeleton className="h-4 w-20 bg-neutral-800" />
              </div>
              <div className="flex gap-5 sm:gap-6 items-start">
                <Skeleton className="w-32 sm:w-36 aspect-2/3 bg-neutral-800 shrink-0" />
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-3 w-16 bg-neutral-800" />
                  <Skeleton className="h-6 w-full bg-neutral-800" />
                  <Skeleton className="h-14 w-full bg-neutral-800" />
                </div>
              </div>
            </div>
            <div className="mt-8 pt-4 border-t border-neutral-800 flex justify-between">
              <Skeleton className="h-4 w-24 bg-neutral-800" />
              <Skeleton className="h-4 w-20 bg-neutral-800" />
            </div>
          </div>

          {/* 2위 & 3위 카드 스켈레톤 */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="flex-1 p-5 bg-[#fafafa] border border-neutral-200 flex gap-4 items-center">
              <Skeleton className="w-20 aspect-2/3 bg-neutral-200 shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-16 bg-neutral-200" />
                <Skeleton className="h-5 w-full bg-neutral-200" />
                <Skeleton className="h-3 w-12 bg-neutral-200" />
              </div>
            </div>
            <div className="flex-1 p-5 bg-[#fafafa] border border-neutral-200 flex gap-4 items-center">
              <Skeleton className="w-20 aspect-2/3 bg-neutral-200 shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-16 bg-neutral-200" />
                <Skeleton className="h-5 w-full bg-neutral-200" />
                <Skeleton className="h-3 w-12 bg-neutral-200" />
              </div>
            </div>
          </div>

          {/* 4~7위 리스트 스켈레톤 */}
          <div className="lg:col-span-4 p-6 bg-[#fafafa] border border-neutral-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between pb-3 border-b border-neutral-200">
                <Skeleton className="h-4 w-16 bg-neutral-200" />
                <Skeleton className="h-4 w-12 bg-neutral-200" />
              </div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3.5 py-1.5">
                  <Skeleton className="h-5 w-5 bg-neutral-200 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-full bg-neutral-200" />
                    <Skeleton className="h-3 w-2/3 bg-neutral-200" />
                  </div>
                </div>
              ))}
            </div>
            <Skeleton className="h-9 w-full bg-neutral-200 mt-4" />
          </div>
        </div>
      </div>
    </section>
  );
};
