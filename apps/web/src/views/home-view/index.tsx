"use client";

import { MainBookSlider } from "@/features/book/components/book-slider/main-book-slider";
import { PopularBookSlider } from "@/features/book/components/book-slider/popular-book-slider";
import { RecentSalesSlider } from "@/features/book-sale/components/sale-market/recent-sale-slider";
import { HomeHeading } from "@/features/intro/components/home-heading";
import { LoungeHomeWidget } from "@/features/reading-log/components/lounge-feed/lounge-home-widget";
import { RecentReviewList } from "@/features/review/components/recent-review-list";
import { AdBanner } from "@/shared/components/ads/ad-banner";

export const HomeView = () => {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <HomeHeading />
        <MainBookSlider />
      </div>

      <PopularBookSlider />

      <LoungeHomeWidget />

      <RecentSalesSlider />

      {/* 광고 배너 */}
      <AdBanner
        dataAdSlot="9804554356"
        dataAdFormat="horizontal"
        className="w-full my-4"
      />

      <RecentReviewList />
    </div>
  );
};

export default HomeView;
