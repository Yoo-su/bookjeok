"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { saveCurrentReturnUrl } from "@/features/auth/utils/return-url";
import { useConfirm } from "@/features/confirm";
import { useDeleteReviewMutation } from "@/features/review/mutations";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { ReviewGridList } from "../review-grid-list";

export const MyReviewList = () => {
  const t = useTranslations("my_reviews");
  const confirm = useConfirm();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { mutateAsync: deleteReviewMutation } = useDeleteReviewMutation();

  useEffect(() => {
    if (!user) {
      saveCurrentReturnUrl();
      router.replace(PATHS.LOGIN);
    }
  }, [user, router]);

  const handleDeleteReview = async (id: number) => {
    const isConfirmed = await confirm({
      title: t("delete_modal.title"),
      description: t("delete_modal.desc"),
      confirmText: t("delete_modal.confirm"),
      cancelText: t("delete_modal.cancel"),
      variant: "destructive",
    });

    if (isConfirmed) {
      await deleteReviewMutation(id);
    }
  };

  const handleEditReview = async (id: number) => {
    const isConfirmed = await confirm({
      title: t("edit_modal.title"),
      description: t("edit_modal.desc"),
      confirmText: t("edit_modal.confirm"),
      cancelText: t("edit_modal.cancel"),
    });

    if (isConfirmed) {
      router.push(PATHS.REVIEW_EDIT(id));
    }
  };

  if (!user) {
    return null;
  }

  return (
    <ReviewGridList
      userId={user.id}
      searchQuery=""
      category={null}
      clearFilters={() => {}}
      onDeleteReview={handleDeleteReview}
      onEditReview={handleEditReview}
    />
  );
};
