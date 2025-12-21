"use client";

import { useReviewDetailQuery } from "@/features/review/queries";
import { Review } from "@/features/review/types";
import { ScrollTopButton } from "@/shared/components/ui/scroll-top-button";

import { ReviewDetailActions } from "./actions";
import { ReviewDetailContent } from "./content";
import { ReviewDetailHeader } from "./header";
import { ReviewDetailSkeleton } from "./skeleton";

interface ReviewDetailProps {
  id: number;
  initialReview?: Review | null;
}

export const ReviewDetail = ({ id, initialReview }: ReviewDetailProps) => {
  const {
    data: review,
    isLoading,
    error,
  } = useReviewDetailQuery(id, !!id, initialReview ?? undefined);

  if (isLoading) {
    return <ReviewDetailSkeleton />;
  }

  if (error || !review) {
    return (
      <div className="container mx-auto py-20 text-center text-destructive">
        리뷰를 불러오는데 실패했습니다.
      </div>
    );
  }

  const book = review.book;

  return (
    <article className="min-h-screen bg-white pb-20">
      <ReviewDetailHeader review={review} book={book} />

      <div className="container mx-auto px-4 max-w-4xl py-16">
        <ReviewDetailContent content={review.content} />
        <ReviewDetailActions
          reviewId={String(id)}
          reviewUserId={review.userId}
          reactionCounts={review.reactionCounts}
        />
      </div>
      <ScrollTopButton />
    </article>
  );
};
