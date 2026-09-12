"use client";

import { useRecommendedReviewsQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useInView } from "react-intersection-observer";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { ReviewCard } from "@/features/review/components/common/review-card";

import { RecommendReviewsSkeleton } from "./skeleton";

interface RecommendReviewsProps {
  id: number;
  category: string;
}

/**
 * 리뷰 상세페이지 추천 리뷰(같은 작가 + 같은 카테고리) 섹션
 */
export const RecommendReviews = ({ id, category }: RecommendReviewsProps) => {
  const t = useTranslations("review.recommend");
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "200px" });

  const {
    data: reviews,
    isLoading,
    isError,
  } = useRecommendedReviewsQuery(id, inView);

  if (isLoading) {
    return <RecommendReviewsSkeleton />;
  }

  if (isError) {
    return (
      <section
        ref={ref}
        className="w-full py-12 border-t border-stone-100 mt-12"
      >
        <div className="text-center text-red-500 py-8">{t("error")}</div>
      </section>
    );
  }

  if (!Array.isArray(reviews) || reviews.length === 0) {
    return (
      <section
        ref={ref}
        className="w-full py-12 border-t border-stone-100 mt-12"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-stone-800">{t("title")}</h2>
            <p className="text-sm text-stone-500 mt-1">{t("subtitle")}</p>
          </div>
        </div>
        <div className="text-center py-12 bg-stone-50 rounded-xl text-stone-500">
          {t("empty")}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="w-full py-12 border-t border-stone-100 mt-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-stone-800">{t("title")}</h2>
          <p className="text-sm text-stone-500 mt-1">{t("subtitle")}</p>
        </div>
      </div>

      <Swiper
        modules={[Autoplay]}
        slidesPerView="auto"
        spaceBetween={16}
        className="w-full p-1!"
        autoplay={{ delay: 5000, disableOnInteraction: false }}
      >
        {reviews.map((review, index) => (
          <SwiperSlide
            key={review.id}
            className="w-[280px]! sm:w-[320px]! h-auto select-none"
          >
            <ReviewCard.Root review={review} priority={index < 2}>
              <ReviewCard.Image />
              <ReviewCard.Content>
                <ReviewCard.Meta />
                <ReviewCard.Title />
                <ReviewCard.Tags />
                <ReviewCard.Action />
              </ReviewCard.Content>
            </ReviewCard.Root>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};
