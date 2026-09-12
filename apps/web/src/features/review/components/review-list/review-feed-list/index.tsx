"use client";

import { useReviewFeedsQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { ReviewCard } from "../../common/review-card";
import { ReviewFeedListSkeleton } from "./skeleton";

export function ReviewFeedList() {
  const t = useTranslations("review.list");
  const { data: feedsData, isLoading, isError } = useReviewFeedsQuery();

  if (isLoading) {
    return <ReviewFeedListSkeleton />;
  }

  if (isError) {
    return (
      <div className="py-20 text-center text-stone-400 border border-dashed border-stone-200 text-sm">
        {t("feed_error")}
      </div>
    );
  }

  if (!Array.isArray(feedsData) || feedsData.length === 0) {
    return (
      <div className="text-center py-20 text-stone-400 font-light">
        {t("no_reviews")}
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {feedsData.map((feed, feedIndex) => (
        <section key={feed.category} className="review-feed-section">
          {/* 카테고리 헤더 */}
          <div className="flex items-center justify-between mb-8 px-1">
            <div className="flex items-center gap-3">
              <div
                className="h-px bg-stone-300 transition-all duration-300"
                style={{ width: `${24 + feedIndex * 12}px` }}
              />
              <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
                {feed.category}
              </h2>
              <span className="text-[10px] text-stone-400 font-light tracking-wide">
                {t("recent_label")}
              </span>
            </div>

            {/* 더보기 링크 */}
            {feed.reviews.length >= 4 && (
              <Link
                href={`${PATHS.REVIEWS}?category=${feed.category}`}
                className="group flex items-center gap-1 text-stone-400 hover:text-stone-700 transition-colors duration-200"
              >
                <span className="text-xs font-light relative pb-0.5 border-b border-stone-200 group-hover:border-stone-500 transition-colors duration-200">
                  {t("more")}
                </span>
                <span className="text-[10px] transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
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
                className="w-[280px]! sm:w-[320px]! h-auto select-none"
              >
                <ReviewCard review={review} />
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      ))}
    </div>
  );
}
