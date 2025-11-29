"use client";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

import Link from "next/link";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { ReviewFeed } from "@/features/review/types";

import { ReviewCard } from "./review-card";

interface ReviewFeedListProps {
  feedsData: ReviewFeed[] | undefined;
}

export function ReviewFeedList({ feedsData }: ReviewFeedListProps) {
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
              href={`/review?category=${feed.category}`}
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
