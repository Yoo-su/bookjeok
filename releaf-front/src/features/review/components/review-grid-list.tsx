import { MessageSquare } from "lucide-react";
import Link from "next/link";

import { Review } from "@/features/review/types";
import { Button } from "@/shared/components/shadcn/button";

import { ReviewCard } from "./review-card";

interface ReviewGridListProps {
  reviews: Review[];
  searchQuery: string;
  category: string | null;
  clearFilters: () => void;
  loadMoreRef?: (node?: Element | null) => void;
  isFetchingNextPage?: boolean;
}

export function ReviewGridList({
  reviews,
  searchQuery,
  category,
  clearFilters,
  loadMoreRef,
  isFetchingNextPage,
}: ReviewGridListProps) {
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
            <Link href="/review/write">첫 리뷰 작성하기</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        {reviews.map((review, index) => (
          <ReviewCard key={review.id} review={review} priority={index < 4} />
        ))}
      </div>

      {/* Infinite Scroll Trigger & Loading State */}
      <div ref={loadMoreRef} className="h-10 flex justify-center items-center">
        {isFetchingNextPage && (
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        )}
      </div>
    </div>
  );
}
