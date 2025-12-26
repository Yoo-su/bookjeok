"use client";

import { Edit } from "lucide-react";
import Link from "next/link";

import { useAuthStore } from "@/features/auth/store";
import { CommentSection } from "@/features/comment/components/comment-section";
import { CommentTargetType } from "@/features/comment/types";
import { useReviewDetailQuery } from "@/features/review/queries";
import { Review } from "@/features/review/types";
import { Button } from "@/shared/components/shadcn/button";
import { NotFoundRedirect } from "@/shared/components/ui/not-found-redirect";
import { ScrollTopButton } from "@/shared/components/ui/scroll-top-button";
import { PATHS } from "@/shared/constants/paths";

import { ReviewDetailActions } from "./actions";
import { ReviewDetailContent } from "./content";
import { ReviewDetailHeader } from "./header";
import { ReviewDetailSkeleton } from "./skeleton";

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
    return <ReviewDetailSkeleton />;
  }

  if (error || !review) {
    return (
      <NotFoundRedirect
        message="존재하지 않거나 삭제된 리뷰입니다."
        fallbackPath={PATHS.REVIEWS}
      />
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
          reviewId={String(id)}
          reactionCounts={review.reactionCounts}
        />

        {/* 댓글 섹션 */}
        <CommentSection
          targetType={CommentTargetType.REVIEW}
          targetId={String(id)}
        />

        {/* 네비게이션 & 편집 버튼 */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-stone-100">
          <Button
            variant="ghost"
            className="text-stone-500 hover:text-stone-900"
            asChild
          >
            <Link href={PATHS.REVIEWS}>← Back to Reviews</Link>
          </Button>

          {isAuthor && (
            <Button
              variant="outline"
              size="sm"
              className="border-stone-200 hover:bg-stone-50"
              asChild
            >
              <Link href={PATHS.REVIEW_EDIT(String(id))}>
                <Edit className="w-4 h-4 mr-2" />
                리뷰 수정하기
              </Link>
            </Button>
          )}
        </div>
      </div>
      <ScrollTopButton />
    </article>
  );
};
