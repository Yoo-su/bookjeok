"use client";

import { useParams } from "next/navigation";

import { useAuthStore } from "@/features/auth/store";
import { ReviewDetailActions } from "@/features/review/components/review-detail-actions";
import { ReviewDetailContent } from "@/features/review/components/review-detail-content";
import { ReviewDetailHeader } from "@/features/review/components/review-detail-header";
import { useReviewDetailQuery } from "@/features/review/queries";
import { Spinner } from "@/shared/components/shadcn/spinner";

export const ReviewDetailView = () => {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuthStore();

  const {
    data: review,
    isLoading,
    error,
  } = useReviewDetailQuery(Number(id), !!id);

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
          reviewId={id}
          reactionCounts={review.reactionCounts}
        />
      </div>
    </article>
  );
};
