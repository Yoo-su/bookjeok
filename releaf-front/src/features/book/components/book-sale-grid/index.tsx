"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { useInfiniteBookSalesQuery } from "../../queries";
import { SearchBookSalesParams } from "../../types";
import { BookSaleCard } from "../common/book-sale-card";

interface BookSaleGridProps {
  filterParams: SearchBookSalesParams;
}

export const BookSaleGrid = ({ filterParams }: BookSaleGridProps) => {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteBookSalesQuery(filterParams);

  const { ref, inView } = useInView({
    threshold: 0.5, // 50% 보일 때 트리거
  });

  // 무한 스크롤을 위한 로직
  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching, fetchNextPage]);

  const sales = data?.pages.flatMap((page) => page.sales) || [];

  // 첫 페이지 로딩 중일 때 스켈레톤 UI 표시
  if (isFetching && !isFetchingNextPage && !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <BookSaleCard.Skeleton key={i} />
        ))}
      </div>
    );
  }

  // 에러 발생 시
  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-red-500">
        <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  // 검색 결과가 없을 때
  if (sales.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <p>해당 조건에 맞는 판매글이 없습니다.</p>
      </div>
    );
  }

  // 성공적으로 데이터를 가져왔을 때
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sales.map((sale, idx) => (
          <BookSaleCard key={sale.id} idx={idx} sale={sale} />
        ))}
      </div>

      {/* 다음 페이지를 불러오기 위한 트리거 요소 */}
      <div ref={ref} className="h-10" />

      {/* 다음 페이지 로딩 중일 때 스피너 표시 */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      )}
    </div>
  );
};
