"use client";

import { AiSearchBookItem, formatAladinCoverImage } from "@bookjeok/core";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Highlighter } from "@/shared/components/magicui/highlighter";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface AiBookRecommendSliderProps {
  books: AiSearchBookItem[];
}

export const AiBookRecommendSlider = memo(function AiBookRecommendSlider({
  books,
}: AiBookRecommendSliderProps) {
  const t = useTranslations("book.ai_recommend_slider");
  if (!books || books.length === 0) return null;

  return (
    <div className="mt-3 w-full bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl p-4 space-y-3 shadow-sm shadow-stone-900/5 ring-1 ring-stone-900/5">
      <div className="flex items-center justify-between border-b border-stone-200/50 pb-3 mb-1">
        <h2 className="text-xs sm:text-sm font-semibold tracking-wide text-stone-800 flex items-center">
          <Highlighter action="underline" color="#FF9800" className="pb-0.5">
            {t("title")}
          </Highlighter>
          <span className="text-xs font-normal text-stone-500 ml-1.5">
            {t("count", { count: books.length })}
          </span>
        </h2>
        <span className="text-[11px] text-stone-400">{t("swipe_hint")}</span>
      </div>

      <Swiper
        modules={[FreeMode]}
        freeMode={true}
        slidesPerView={1.1}
        spaceBetween={12}
        breakpoints={{
          640: { slidesPerView: 1.4, spaceBetween: 14 },
          1024: { slidesPerView: 1.6, spaceBetween: 16 },
        }}
        className="w-full !py-1"
      >
        {books.map((book) => (
          <SwiperSlide key={book.isbn} className="!h-auto">
            <div className="h-full bg-white/85 backdrop-blur-xs border border-stone-200/80 rounded-2xl p-3.5 flex flex-row gap-3.5 shadow-2xs hover:border-stone-300 transition-all">
              {/* 책 표지 (줄어든 크기, 좌측) */}
              <Link
                href={PATHS.BOOK_DETAIL(book.isbn)}
                prefetch={false}
                className="relative w-20 sm:w-24 shrink-0 aspect-3/4 overflow-hidden rounded-lg bg-stone-100 shadow-xs group block"
              >
                <Image
                  src={formatAladinCoverImage(book.image)}
                  alt={book.title}
                  fill
                  sizes="(max-width: 640px) 80px, 96px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
              </Link>

              {/* 오른쪽 도서 정보 & 추천 사유 */}
              <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                <div>
                  <Link
                    href={PATHS.BOOK_DETAIL(book.isbn)}
                    prefetch={false}
                    className="group block"
                  >
                    <h3 className="text-xs sm:text-sm font-semibold text-stone-800 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {book.title}
                    </h3>
                  </Link>
                  <p className="text-[11px] sm:text-xs text-stone-400 truncate mt-0.5">
                    {book.author} {book.publisher ? `· ${book.publisher}` : ""}
                  </p>
                </div>

                {book.reason && (
                  <div className="p-2.5 bg-stone-50/70 backdrop-blur-xs rounded-xl text-[11px] sm:text-xs text-stone-600 leading-relaxed border border-stone-200/50 flex-1 flex flex-col justify-center">
                    <span className="font-semibold text-stone-800 block mb-0.5 text-[11px]">
                      {t("recommend_reason")}
                    </span>
                    <p className="line-clamp-3 sm:line-clamp-4 text-stone-600">
                      {book.reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
});
