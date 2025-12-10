"use client";

import Link from "next/link";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { useReviewFeedsQuery } from "@/features/review/queries";

import { ReviewCard } from "../review-card";
import { ReviewFeedListSkeleton } from "./skeleton";

export function ReviewFeedList() {
  const { data: feedsData, isLoading, isError } = useReviewFeedsQuery();

  if (isLoading) {
    return <ReviewFeedListSkeleton />;
  }

  if (isError) {
    return (
      <div className="py-20 text-center text-red-500 bg-red-50 rounded-xl border border-red-100 border-dashed">
        피드 정보를 불러오는데 실패했습니다.
      </div>
    );
  }

  if (!feedsData || feedsData.length === 0) {
    return (
      <div className="text-center py-20 text-stone-500">
        등록된 리뷰가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {feedsData.map((feed) => (
        <div key={feed.category} className="review-feed-section">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-2xl font-serif font-bold text-stone-900">
              {feed.category}
            </h2>
            <Link
              href={`/book/reviews?category=${feed.category}`}
              className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
            >
              더보기
            </Link>
          </div>

          <Swiper
            modules={[Pagination]}
            spaceBetween={16}
            slidesPerView="auto"
            pagination={{ clickable: true, dynamicBullets: true }}
            className="pb-12! px-1!"
          >
            {feed.reviews.map((review) => (
              <SwiperSlide
                key={review.id}
                className="w-[280px]! sm:w-[320px]! h-auto"
              >
                <ReviewCard review={review} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ))}
    </div>
  );
}
