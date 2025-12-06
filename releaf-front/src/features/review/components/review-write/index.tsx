"use client";

import { useRouter } from "next/navigation";

import { ReviewForm } from "@/features/review/components/review-form";
import { useCreateReviewMutation } from "@/features/review/mutations";
import { ReviewFormValues } from "@/features/review/types";
import { PATHS } from "@/shared/constants/paths";

export const ReviewWrite = () => {
  const router = useRouter();
  const {
    mutateAsync: createReview,
    isPending: isSubmitting,
    isSuccess,
  } = useCreateReviewMutation();

  const handleSubmit = async (data: ReviewFormValues) => {
    await createReview(data);
    router.push(PATHS.REVIEWS);
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">책 후기 작성</h1>
      <ReviewForm
        onSubmit={handleSubmit}
        submitLabel="작성 완료"
        isSubmitting={isSubmitting || isSuccess}
      />
    </div>
  );
};
