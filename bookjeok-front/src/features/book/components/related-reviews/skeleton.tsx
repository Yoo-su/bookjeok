import { Swiper, SwiperSlide } from "swiper/react";

import { ReviewCardSkeleton } from "@/features/review/components/review-card/skeleton";

/**
 * 관련 리뷰 섹션 스켈레톤
 * - 슬라이더 형태로 표시
 */
export const RelatedReviewsSkeleton = () => {
  return (
    <Swiper spaceBetween={16} slidesPerView="auto" className="w-full">
      {[...Array(4)].map((_, i) => (
        <SwiperSlide key={i} className="w-[320px]! sm:w-[380px]!">
          <ReviewCardSkeleton />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};
