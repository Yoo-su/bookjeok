"use client";

import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { useReviewsQuery } from "@/features/review/queries";

import { RecentReviewSliderSkeleton } from "./skeleton";
import { SliderReviewCard } from "./slider-review-card";

export const RecentReviewSlider = () => {
  const { data: reviewsData, isLoading } = useReviewsQuery({
    page: 1,
    limit: 10,
  });

  const reviews = reviewsData?.reviews || [];

  const SliderHeader = () => (
    <div className="text-right mb-12">
      <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-wider text-sky-600 uppercase bg-sky-50 rounded-full">
        Fresh Reviews
      </span>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
        <span className="text-sky-600">가볍게 한 줄,</span> 최근 리뷰
      </h2>
      <p className="mt-4 text-lg text-gray-500 max-w-2xl ml-auto">
        부담 없이 읽고, 부담 없이 써보세요.
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <section className="w-full py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <SliderHeader />
        </div>
        <RecentReviewSliderSkeleton />
      </section>
    );
  }

  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <SliderHeader />
      </div>
      <Swiper
        modules={[Autoplay]}
        slidesPerView={"auto"}
        spaceBetween={20}
        loop={reviews.length > 3}
        centeredSlides={true}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        className="px-4!"
      >
        {reviews.map((review) => (
          <SwiperSlide key={review.id} className="w-[260px]! py-4">
            <SliderReviewCard review={review} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};
