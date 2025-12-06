"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { useReviewsInfiniteQuery } from "@/features/review/queries";
import { Button } from "@/shared/components/shadcn/button";
import { PATHS } from "@/shared/constants/paths";

import { ReviewCard } from "../review-card";
import { ReviewCardSkeleton } from "../review-card/skeleton";
import { ReviewGridListSkeleton } from "./review-grid-list-skeleton";

interface ReviewGridListProps {
  searchQuery: string;
  category: string | null;
  clearFilters: () => void;
  onDeleteReview?: (id: number) => void;
  onEditReview?: (id: number) => void;
  userId?: number;
}

export function ReviewGridList({
  searchQuery,
  category,
  clearFilters,
  onDeleteReview,
  onEditReview,
  userId,
}: ReviewGridListProps) {
  // 1. 데이터 조회
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReviewsInfiniteQuery({
    limit: 12,
    category,
    search: searchQuery,
    userId,
  });

  // 2. 무한 스크롤
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // 3. 로딩 가드 (초기 로딩)
  if (isLoading) {
    return <ReviewGridListSkeleton />;
  }

  // 4. 에러 가드
  if (isError) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-red-500">
        <p className="mb-4">리뷰 목록을 불러오는데 실패했습니다.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          다시 시도
        </Button>
      </div>
    );
  }

  const reviews = data?.pages.flatMap((page) => page.reviews) || [];

  // 5. 빈 상태 가드
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6">
          <MessageSquare className="w-8 h-8 text-stone-400" />
        </div>
        <h3 className="text-2xl font-serif font-bold text-stone-800 mb-3">
          {searchQuery || category
            ? "검색 결과가 없습니다"
            : "아직 작성된 리뷰가 없습니다"}
        </h3>
        <p className="text-stone-500 mb-8 max-w-md mx-auto">
          {searchQuery || category
            ? "다른 검색어나 카테고리로 다시 시도해보세요."
            : "가장 먼저 책에 대한 이야기를 들려주세요. 당신의 이야기가 누군가에게는 큰 영감이 됩니다."}
        </p>
        {searchQuery || category ? (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="border-stone-300 hover:bg-stone-50"
          >
            전체 목록 보기
          </Button>
        ) : (
          <Button
            asChild
            variant="outline"
            className="border-stone-300 hover:bg-stone-50"
          >
            <Link href={PATHS.REVIEW_WRITE}>첫 리뷰 작성하기</Link>
          </Button>
        )}
      </div>
    );
  }

  // 6. 성공 렌더링
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        {reviews.map((review, index) => (
          <ReviewCard
            key={review.id}
            review={review}
            priority={index < 4}
            onDelete={onDeleteReview}
            onEdit={onEditReview}
          />
        ))}
        {isFetchingNextPage && (
          <>
            <ReviewCardSkeleton />
            <ReviewCardSkeleton />
          </>
        )}
      </div>

      {/* Infinite Scroll Trigger */}
      <div ref={ref} className="h-10 invisible" />
    </div>
  );
}
