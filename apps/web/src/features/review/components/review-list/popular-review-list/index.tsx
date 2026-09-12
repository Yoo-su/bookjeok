"use client";

import { usePopularReviewsQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { Swiper, SwiperSlide } from "swiper/react";

import { PopularReviewItem } from "./popular-review-item";
import { PopularReviewListSkeleton } from "./skeleton";

export function PopularReviewList() {
  const t = useTranslations("review.list");
  // 1. 데이터 조회
  const { data: reviews, isLoading, isError } = usePopularReviewsQuery();

  // 2. 로딩 가드
  if (isLoading) {
    return <PopularReviewListSkeleton />;
  }

  // 3. 에러 가드
  if (isError) {
    return (
      <section className="mb-12">
        <div className="h-[200px] w-full border border-dashed border-stone-200 flex items-center justify-center text-stone-400 text-sm">
          {t("error")}
        </div>
      </section>
    );
  }

  // 4. 빈 상태 가드
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return null; // 인기 리뷰가 없으면 섹션 자체를 숨김
  }

  // 5. 성공 렌더링
  return (
    <section className="mb-12">
      {/* 헤더 - 미니멀 스타일 */}
      <div className="mb-6">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-semibold text-stone-900">
            {t("popular_title")}
          </h2>
          <span className="text-[10px] font-medium text-stone-400 tracking-wider uppercase">
            {t("popular_badge")}
          </span>
        </div>
      </div>

      {/* Mobile: Swiper */}
      <div className="block md:hidden">
        <Swiper
          spaceBetween={20}
          slidesPerView={1.1}
          breakpoints={{
            450: { slidesPerView: 1.2 },
          }}
          className="w-full px-1! pt-2! pb-4!"
        >
          {reviews.map((review) => (
            <SwiperSlide key={review.id} className="h-auto! select-none">
              <PopularReviewItem review={review} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Desktop: Grid */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviews.map((review) => (
          <PopularReviewItem key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}
