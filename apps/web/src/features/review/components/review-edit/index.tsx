"use client";

import { ReviewFormValues } from "@bookjeok/core";
import { useReviewForEditQuery } from "@bookjeok/react-query";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

import { ReviewForm } from "@/features/review/components/review-form";
import { useUpdateReviewMutation } from "@/features/review/mutations";
import { AlertTriangle } from "@/shared/components/icons/iconsax";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { ReviewEditSkeleton } from "./skeleton";

interface ReviewEditProps {
  id: number;
}

export const ReviewEdit = ({ id }: ReviewEditProps) => {
  const t = useTranslations("review.form");
  const tToast = useTranslations("review.toast");
  const router = useRouter();

  // 수정용 전용 API 사용 (본인 리뷰만 조회 가능)
  const { data: review, isLoading, error } = useReviewForEditQuery(id);

  const {
    mutateAsync: updateReview,
    isPending: isSubmitting,
    isSuccess,
  } = useUpdateReviewMutation();

  // 403 에러 처리 (권한 없음)
  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 403) {
        toast.error(tToast("unauthorized"));
        router.replace(PATHS.MY_PAGE);
      }
    }
  }, [error, router, tToast]);

  // 본문에서 빠진 이미지는 서버가 수정을 커밋한 뒤 지운다
  const handleSubmit = async (data: ReviewFormValues) => {
    await updateReview({ id, data });
    router.push(PATHS.REVIEW_DETAIL(id));
  };

  // 로딩 중: 스켈레톤 UI 표시
  if (isLoading) {
    return <ReviewEditSkeleton />;
  }

  // 에러 또는 데이터 없음
  if (error || !review) {
    return (
      <div className="container mx-auto py-20 text-center text-red-500">
        <AlertTriangle className="mx-auto h-12 w-12" />
        <p className="mt-4 font-semibold">{tToast("fetch_failed")}</p>
      </div>
    );
  }

  // 리뷰 데이터를 폼 초기값으로 변환
  const initialData = {
    title: review.title,
    content: review.content,
    isbn: review.isbn,
    category: review.category || "",
    tags: review.tags || [],
    rating: review.rating || 0,
    isPublic: review.isPublic,
    book: review.book,
  };

  return (
    <div className="container mx-auto py-8 w-full">
      <h1 className="text-3xl font-bold mb-8">{t("title_edit")}</h1>
      <ReviewForm
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel={t("buttons.submit_edit")}
        isSubmitting={isSubmitting || isSuccess}
        isEditMode={true}
      />
    </div>
  );
};
