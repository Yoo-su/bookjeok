"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { useAuthStore } from "@/features/auth/store";
import { getBookDetail } from "@/features/book/apis";
import { ReviewDetailActions } from "@/features/review/components/review-detail-actions";
import { ReviewDetailContent } from "@/features/review/components/review-detail-content";
import { ReviewDetailHeader } from "@/features/review/components/review-detail-header";
import { useReviewDetailQuery } from "@/features/review/queries";

export const ReviewDetailView = () => {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuthStore();

  const {
    data: review,
    isLoading,
    error,
  } = useReviewDetailQuery(Number(id), !!id);

  const { data: bookData } = useQuery({
    queryKey: ["book", review?.bookIsbn],
    queryFn: () => getBookDetail(String(review?.bookIsbn)),
    enabled: !!review?.bookIsbn,
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-20 flex justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
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

  const book =
    bookData && "items" in bookData
      ? (bookData.items[0] as any)
      : (bookData as any);

  const isAuthor = user?.id === review.userId;

  return (
    <article className="min-h-screen bg-white pb-20">
      <ReviewDetailHeader review={review} book={book} />

      <div className="container mx-auto px-4 max-w-4xl py-16">
        <ReviewDetailContent content={review.content} />
        <ReviewDetailActions isAuthor={isAuthor} reviewId={id} />
      </div>
    </article>
  );
};
