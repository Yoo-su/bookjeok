"use client";

import "swiper/css";

import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { ReviewCard } from "@/features/review/components/review-card";
import { useReviewsQuery } from "@/features/review/queries";

import { RecentReviewSliderSkeleton } from "./skeleton";

export const RecentReviewSlider = () => {
  const { data: reviewsData, isLoading } = useReviewsQuery({
    page: 1,
    limit: 10,
  });

  const reviews = reviewsData?.reviews || [];

  const SliderHeader = () => (
    <div className="text-center mb-10">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        <span className="text-transparent bg-clip-text bg-linear-to-r from-stone-700 to-amber-900">
          진솔한 기록,
        </span>
        지금 막 올라온 리뷰
      </h2>
      <p className="mt-4 text-lg text-gray-600">
        다른 독자들의 솔직한 감상평을 확인해보세요.
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <section className="w-full py-12 bg-white overflow-hidden">
        <SliderHeader />
        <RecentReviewSliderSkeleton />
      </section>
    );
  }

  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-12 bg-white overflow-hidden">
      <SliderHeader />
      <Swiper
        modules={[Autoplay]}
        slidesPerView={"auto"}
        spaceBetween={24}
        loop={reviews.length > 3}
        centeredSlides={true}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        className="px-4! pb-4!"
      >
        {reviews.map((review) => (
          <SwiperSlide key={review.id} className="w-[320px]! sm:w-[360px]!">
            <ReviewCard review={review} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};
