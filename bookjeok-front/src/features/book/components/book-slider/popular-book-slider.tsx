"use client";

import { TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { PATHS } from "@/shared/constants/paths";

import { usePopularBooksQuery } from "../../queries";

/**
 * 인기책 슬라이더 컴포넌트
 * - 조회수, 판매글, 리뷰 데이터 기반 인기책 표시
 * - 순위 배지 + 호버 정보 오버레이
 */
export const PopularBookSlider = () => {
  const { data: books, isLoading, isError } = usePopularBooksQuery();

  if (isLoading) {
    return <PopularBookSliderSkeleton />;
  }

  if (isError || !books || books.length === 0) {
    return null; // 데이터가 없으면 섹션 자체를 숨김
  }

  return (
    <section className="w-full py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-bold text-stone-900">
              지금 주목받는 책
            </h2>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            조회수와 리뷰를 기반으로 선정된 인기 도서입니다
          </p>
        </div>

        {/* 슬라이더 */}
        <Swiper
          modules={[Autoplay]}
          slidesPerView="auto"
          spaceBetween={16}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          className="w-full"
        >
          {books.map((book, index) => (
            <SwiperSlide key={book.isbn} className="w-[140px]! sm:w-[160px]!">
              <Link href={PATHS.BOOK_DETAIL(book.isbn)} passHref>
                <div className="group">
                  {/* 책 표지 */}
                  <div className="relative aspect-2/3 rounded-lg overflow-hidden shadow-sm group-hover:shadow-lg transition-all duration-300">
                    <Image
                      src={book.image || "/placeholder.jpg"}
                      alt={book.title}
                      fill
                      sizes="160px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* 순위 배지 */}
                    <div
                      className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                        index === 0
                          ? "bg-rose-500 text-white"
                          : index === 1
                            ? "bg-stone-700 text-white"
                            : index === 2
                              ? "bg-amber-600 text-white"
                              : "bg-white/90 text-stone-700"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* 책 정보 (아래) */}
                  <div className="mt-3 space-y-1">
                    <h3 className="text-sm font-medium text-stone-900 line-clamp-2 group-hover:text-rose-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-1">
                      {book.author}
                    </p>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

/**
 * 인기책 슬라이더 스켈레톤
 */
const PopularBookSliderSkeleton = () => {
  return (
    <section className="w-full py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-64 mt-1" />
        </div>

        <div className="flex gap-4 overflow-hidden">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-[140px] sm:w-[160px] shrink-0">
              <Skeleton className="aspect-2/3 rounded-lg" />
              <div className="mt-3 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
