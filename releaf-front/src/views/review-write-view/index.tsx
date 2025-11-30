"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createReview } from "@/features/review/apis";
import { ReviewForm } from "@/features/review/components/review-form";
import { ReviewFormValues } from "@/features/review/types";
import { PATHS } from "@/shared/constants/paths";

export const ReviewWriteView = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ReviewFormValues) => {
    setIsSubmitting(true);
    try {
      await createReview(data);
      alert("리뷰가 작성되었습니다!");
      router.push(PATHS.REVIEWS); // 리뷰 목록으로 리다이렉트
    } catch (error: any) {
      console.error("Review creation error:", error);
      alert(error.message || "리뷰 작성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">책 후기 작성</h1>
      <ReviewForm
        onSubmit={handleSubmit}
        submitLabel="작성 완료"
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
