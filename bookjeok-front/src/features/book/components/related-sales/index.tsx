"use client";

import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Button } from "@/shared/components/shadcn/button";
import { PATHS } from "@/shared/constants/paths";

import { useRelatedSalesQuery } from "../../queries";
import { BookSaleCard } from "../common/book-sale-card";
import { RelatedSalesSkeleton } from "./skeleton";

interface RelatedSalesProps {
  isbn: string;
}

/**
 * 책 상세페이지 관련 판매글 섹션
 * - 최대 4개 표시 + 더보기 링크
 * - 슬라이더 형태
 */
export const RelatedSales = ({ isbn }: RelatedSalesProps) => {
  // 뷰포트 진입 시 데이터 로딩
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "200px" });

  const { data, isLoading, isError } = useRelatedSalesQuery({
    isbn,
    limit: 4,
    enabled: inView,
  });

  const sales = data?.sales || [];
  const totalCount = data?.total || 0;

  return (
    <section ref={ref} className="w-full py-12">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl text-stone-600">이 책을 판매하는 사람들</h2>

        {totalCount > 4 && (
          <Link href={`${PATHS.BOOK_MARKET}?isbn=${isbn}`}>
            <Button variant="ghost" size="sm" className="text-stone-500">
              더보기 ({totalCount}개)
            </Button>
          </Link>
        )}
      </div>

      {/* 로딩 상태 */}
      {(!inView || isLoading) && <RelatedSalesSkeleton />}

      {/* 에러 상태 */}
      {isError && (
        <div className="text-center text-red-500 py-8">
          판매글을 불러오는 데 실패했습니다.
        </div>
      )}

      {/* 빈 상태 */}
      {inView && !isLoading && !isError && sales.length === 0 && (
        <div className="text-center py-12 bg-stone-50 rounded-xl">
          <p className="text-stone-500 mb-4">아직 등록된 판매글이 없습니다.</p>
          <Link href={PATHS.BOOK_SALES_REGISTER}>
            <Button variant="outline" size="sm">
              첫 번째 판매글 등록하기
            </Button>
          </Link>
        </div>
      )}

      {/* 슬라이더 */}
      {inView && !isLoading && !isError && sales.length > 0 && (
        <Swiper
          modules={[Autoplay]}
          slidesPerView="auto"
          spaceBetween={16}
          className="w-full overflow-visible! [clip-path:inset(-100px_-10px)]"
        >
          {sales.map((sale, index) => (
            <SwiperSlide key={sale.id} className="w-[260px]!">
              <BookSaleCard sale={sale} idx={index} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
};
