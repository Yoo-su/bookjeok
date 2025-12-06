"use client";

import { useAuthStore } from "@/features/auth/store";
import { useReviewDetailQuery } from "@/features/review/queries";
import { Review } from "@/features/review/types";
import { Spinner } from "@/shared/components/shadcn/spinner";

import { ReviewDetailActions } from "./actions";
import { ReviewDetailContent } from "./content";
import { ReviewDetailHeader } from "./header";

interface ReviewDetailProps {
  id: number;
  initialReview?: Review | null;
}

export const ReviewDetail = ({ id, initialReview }: ReviewDetailProps) => {
  const { user } = useAuthStore();

  const {
    data: review,
    isLoading,
    error,
  } = useReviewDetailQuery(id, !!id, initialReview ?? undefined);

  if (isLoading) {
    return (
      <div className="container mx-auto py-20 flex justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="container mx-auto py-20 text-center text-destructive">
        리뷰를 불러오는데 실패했습니다.
      </div>
    );
  }

  const book = review.book;
  const isAuthor = user?.id === review.userId;

  return (
    <article className="min-h-screen bg-white pb-20">
      <ReviewDetailHeader review={review} book={book} />

      <div className="container mx-auto px-4 max-w-4xl py-16">
        <ReviewDetailContent content={review.content} />
        <ReviewDetailActions
          isAuthor={isAuthor}
          reviewId={String(id)}
          reactionCounts={review.reactionCounts}
        />
      </div>
    </article>
  );
};
