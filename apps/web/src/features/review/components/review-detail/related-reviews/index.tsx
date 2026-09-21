"use client";

import { useReviewsQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useInView } from "react-intersection-observer";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { ReviewCard } from "@/features/review/components/common/review-card";
import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { RelatedReviewsSkeleton } from "./skeleton";

interface RelatedReviewsProps {
  isbn: string;
}

/**
 * 책 상세페이지 관련 리뷰 섹션
 * - 최대 4개 표시 + 더보기 링크
 * - 슬라이더 형태
 */
export const RelatedReviews = ({ isbn }: RelatedReviewsProps) => {
  // 뷰포트 진입 시 데이터 로딩
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "200px" });

  const { data, isLoading, isError } = useReviewsQuery(
    { isbn: isbn, limit: 4 },
    inView,
  );

  const reviews = data?.reviews || [];
  const totalCount = data?.total || 0;

  const t = useTranslations("book.detail.related_reviews");

  return (
    <section ref={ref} className="w-full py-12">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-serif tracking-tight text-stone-600">
          {t("title")}
        </h2>

        {totalCount > 4 && (
          <Link href={PATHS.REVIEWS_BY_ISBN(isbn)}>
            <Button variant="ghost" size="sm" className="text-stone-500">
              {t("more", { count: totalCount })}
            </Button>
          </Link>
        )}
      </div>

      {/* 로딩 상태 */}
      {(!inView || isLoading) && <RelatedReviewsSkeleton />}

      {/* 에러 상태 */}
      {isError && (
        <div className="text-center text-red-500 py-8">{t("error")}</div>
      )}

      {/* 빈 상태 */}
      {inView && !isLoading && !isError && reviews.length === 0 && (
        <div className="text-center py-12 bg-stone-50 rounded-xl">
          <p className="text-stone-500 mb-4">{t("empty")}</p>
          <Link href={PATHS.REVIEW_WRITE}>
            <Button variant="outline" size="sm">
              {t("write_first")}
            </Button>
          </Link>
        </div>
      )}

      {/* 슬라이더 */}
      {inView && !isLoading && !isError && reviews.length > 0 && (
        <Swiper
          modules={[Autoplay]}
          slidesPerView="auto"
          spaceBetween={16}
          className="w-full overflow-visible! [clip-path:inset(-100px_-10px)]"
        >
          {reviews.map((review, index) => (
            <SwiperSlide
              key={review.id}
              className="w-[320px]! sm:w-[380px]! select-none"
            >
              <ReviewCard.Root review={review} priority={index < 2}>
                <ReviewCard.Image />
                <ReviewCard.Content>
                  <ReviewCard.Meta />
                  <ReviewCard.Title />
                  <ReviewCard.Tags />
                  <ReviewCard.Action />
                </ReviewCard.Content>
              </ReviewCard.Root>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
};
