"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ReviewForm } from "@/features/review/components/review-form";
import { useUpdateReviewMutation } from "@/features/review/mutations";
import { useReviewDetailQuery } from "@/features/review/queries";
import { ReviewFormValues } from "@/features/review/types";
import { PATHS } from "@/shared/constants/paths";

import { ReviewEditSkeleton } from "./skeleton";

interface ReviewEditProps {
  id: number;
}

export const ReviewEdit = ({ id }: ReviewEditProps) => {
  const router = useRouter();

  // React Query를 사용하여 리뷰 데이터 조회 (캐시 활용)
  const { data: review, isLoading, error } = useReviewDetailQuery(id, !!id);

  const {
    mutateAsync: updateReview,
    isPending: isSubmitting,
    isSuccess,
  } = useUpdateReviewMutation();

  const handleSubmit = async (
    data: ReviewFormValues,
    deletedImageUrls?: string[]
  ) => {
    await updateReview({ id, data, deletedImageUrls });
    router.push(PATHS.REVIEW_DETAIL(id));
  };

  // 로딩 중: 스켈레톤 UI 표시
  if (isLoading) {
    return <ReviewEditSkeleton />;
  }

  // 에러 또는 데이터 없음
  if (error || !review) {
    toast.error("리뷰를 불러오는데 실패했습니다.");
    router.push(PATHS.MY_PAGE);
    return null;
  }

  // 리뷰 데이터를 폼 초기값으로 변환
  const initialData = {
    title: review.title,
    content: review.content,
    bookIsbn: review.bookIsbn,
    category: review.category || "",
    tags: review.tags || [],
    rating: review.rating || 0,
    book: review.book,
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">책 후기 수정</h1>
      <ReviewForm
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="수정 완료"
        isSubmitting={isSubmitting || isSuccess}
        isEditMode={true}
      />
    </div>
  );
};
