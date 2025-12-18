"use client";

import { ArrowRight } from "lucide-react";
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
          {/* 카테고리 헤더 */}
          <div className="flex items-center justify-between mb-8 px-1">
            {/* 카테고리 이름 */}
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-emerald-500 rounded-full" />
              <div>
                <h2
                  className="text-xl font-bold text-stone-900"
                  style={{ fontFamily: "var(--font-nanum-gothic)" }}
                >
                  {feed.category}
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">최신 리뷰</p>
              </div>
            </div>

            {/* 더보기 버튼 (리뷰가 4개 이상일 때만 표시) */}
            {feed.reviews.length >= 4 && (
              <Link
                href={`/book/reviews?category=${feed.category}`}
                className="group flex items-center gap-1 text-stone-500 hover:text-emerald-600 transition-colors"
              >
                <span className="text-sm font-medium relative">
                  더보기
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-emerald-500 transition-all duration-300 group-hover:w-full" />
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            )}
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
