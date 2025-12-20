"use client";

import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { ReviewCard } from "@/features/review/components/review-card";
import { useReviewsQuery } from "@/features/review/queries";
import { Button } from "@/shared/components/shadcn/button";
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

  const { data, isLoading, isError } = useReviewsQuery({
    bookIsbn: isbn,
    limit: 4,
    enabled: inView,
  });

  const reviews = data?.reviews || [];
  const totalCount = data?.total || 0;

  return (
    <section ref={ref} className="w-full py-12">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl text-stone-600">이 책을 읽은 사람들의 이야기</h2>

        {totalCount > 4 && (
          <Link href={`${PATHS.REVIEWS}?bookIsbn=${isbn}`}>
            <Button variant="ghost" size="sm" className="text-stone-500">
              더보기 ({totalCount}개)
            </Button>
          </Link>
        )}
      </div>

      {/* 로딩 상태 */}
      {(!inView || isLoading) && <RelatedReviewsSkeleton />}

      {/* 에러 상태 */}
      {isError && (
        <div className="text-center text-red-500 py-8">
          리뷰를 불러오는 데 실패했습니다.
        </div>
      )}

      {/* 빈 상태 */}
      {inView && !isLoading && !isError && reviews.length === 0 && (
        <div className="text-center py-12 bg-stone-50 rounded-xl">
          <p className="text-stone-500 mb-4">아직 작성된 리뷰가 없습니다.</p>
          <Link href={PATHS.REVIEW_WRITE}>
            <Button variant="outline" size="sm">
              첫 번째 리뷰 작성하기
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
            <SwiperSlide key={review.id} className="w-[320px]! sm:w-[380px]!">
              <ReviewCard review={review} priority={index < 2} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
};
