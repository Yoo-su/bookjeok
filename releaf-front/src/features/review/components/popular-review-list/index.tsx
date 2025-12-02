"use client";

import { usePopularReviewsQuery } from "@/features/review/queries";
import { Badge } from "@/shared/components/shadcn/badge";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

import { PopularReviewItem } from "./popular-review-item";

export function PopularReviewList() {
  const { data: reviews, isLoading } = usePopularReviewsQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-stone-900">🔥 지금 뜨는 리뷰</h2>
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-600 hover:bg-orange-200"
        >
          HOT
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviews.map((review) => (
          <PopularReviewItem key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}
