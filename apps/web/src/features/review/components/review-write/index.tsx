"use client";

import { ReviewFormValues } from "@bookjeok/core";
import { useTranslations } from "next-intl";

import { ReviewForm } from "@/features/review/components/review-form";
import { useCreateReviewMutation } from "@/features/review/mutations";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { useSafeSubmit } from "@/shared/hooks/use-safe-submit";

export const ReviewWrite = () => {
  const t = useTranslations("review.form");
  const router = useRouter();
  const {
    mutateAsync: createReview,
    isPending: isSubmitting,
    isSuccess,
  } = useCreateReviewMutation();

  const { executeSafeSubmit } = useSafeSubmit();

  const handleSubmit = async (data: ReviewFormValues) => {
    await executeSafeSubmit(async (idempotencyKey) => {
      await createReview({ ...data, idempotencyKey } as ReviewFormValues & {
        idempotencyKey?: string;
      });
      router.replace(PATHS.REVIEWS);
    });
  };

  return (
    <div className="container mx-auto py-8 w-full">
      <h1 className="text-3xl font-bold mb-8">{t("title_write")}</h1>
      <ReviewForm
        onSubmit={handleSubmit}
        submitLabel={t("buttons.submit_create")}
        isSubmitting={isSubmitting || isSuccess}
      />
    </div>
  );
};
