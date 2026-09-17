"use client";

import { useReviewsQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";

import { ArrowLeft } from "@/shared/components/icons/iconsax";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { ReviewTicker } from "./review-ticker";
import { RecentReviewListSkeleton } from "./skeleton";

/**
 * 티커가 순환시킬 리뷰 수. 화면에는 5건만 보입니다.
 *
 * 홈은 이 키를 서버에서 시드하므로(`app/[locale]/(default)/page.tsx`) 값을
 * 바꾸면 그쪽 `queryFn`도 함께 맞춰야 합니다. 어긋나면 키가 달라져 시드가
 * 버려지고 마운트마다 새로 조회합니다.
 */
const TICKER_POOL_SIZE = 20;

/**
 * 홈화면 최신 리뷰 목록 컴포넌트 (기존 RecentReviewSlider 대체)
 * 매거진 형태의 목록을 한 줄씩 밀어 올려 새 글이 계속 올라오는 것을 보여줍니다.
 */
export const RecentReviewList = () => {
  const t = useTranslations("home.sections.recent_reviews");
  const { data: reviewsData, isLoading } = useReviewsQuery({
    page: 1,
    limit: TICKER_POOL_SIZE,
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
        <ReviewTicker reviews={reviews} />
      </div>
    </section>
  );
};
