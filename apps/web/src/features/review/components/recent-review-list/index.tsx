"use client";

import { useReviewsQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";

import { ArrowLeft } from "@/shared/components/icons/iconsax";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { ReviewRow } from "./review-row";
import { RecentReviewListSkeleton } from "./skeleton";

/**
 * 홈화면 최신 리뷰 목록 컴포넌트 (기존 RecentReviewSlider 대체)
 * 매거진 형태의 정적 게시판 목록으로 구성하여 커뮤니티 활성화를 유도
 */
export const RecentReviewList = () => {
  const t = useTranslations("home.sections.recent_reviews");
  const { data: reviewsData, isLoading } = useReviewsQuery({
    page: 1,
    limit: 5, // 목록형이므로 상위 5개가 깔끔합니다.
  });

  const reviews = reviewsData?.reviews || [];

  const ListHeader = () => (
    <div className="mb-10 flex flex-col border-b border-stone-200 pb-5 sm:pb-6 relative z-10 text-right px-4 sm:px-0">
      <Link
        href={PATHS.REVIEWS}
        className="group flex justify-between items-end w-full relative z-10"
      >
        {/* 기존 SliderHeader의 동그란 화살표 디자인 유지 */}
        <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border border-stone-300 group-hover:bg-stone-900 group-hover:border-stone-900 transition-all duration-500 shrink-0">
          <ArrowLeft className="w-5 h-5 text-stone-500 group-hover:text-white transition-colors duration-500 rotate-45 group-hover:rotate-0" />
        </div>
        <div className="pl-4">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] text-stone-900 font-medium tracking-tight break-keep leading-tight">
            <span className="block sm:inline sm:mr-3 text-[22px] sm:text-4xl lg:text-[40px] text-stone-400 font-light mb-1 sm:mb-0">
              {t("title_prefix")}
            </span>
            {t("title_suffix")}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-500 font-light break-keep ml-auto">
            {t("desc")}
          </p>
        </div>
      </Link>
    </div>
  );

  if (isLoading) {
    return (
      <section className="w-full py-16">
        <div className="w-full mx-auto px-4">
          <ListHeader />
          <RecentReviewListSkeleton />
        </div>
      </section>
    );
  }

  if (!Array.isArray(reviews) || reviews.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16">
      <div className="w-full mx-auto px-4">
        <ListHeader />
        <div className="flex flex-col border-t border-stone-200/80">
          {reviews.map((review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
};
