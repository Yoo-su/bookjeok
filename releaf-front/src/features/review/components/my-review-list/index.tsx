"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { useAuthStore } from "@/features/auth/store";
import { ReviewGridList } from "@/features/review/components/review-grid-list";
import { useDeleteReviewMutation } from "@/features/review/mutations";
import { useReviewsInfiniteQuery } from "@/features/review/queries";
import { PATHS } from "@/shared/constants/paths";

export const MyReviewList = () => {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { mutateAsync: deleteReviewMutation } = useDeleteReviewMutation();

  useEffect(() => {
    if (!user) {
      router.push(PATHS.LOGIN);
    }
  }, [user, router]);

  const handleDeleteReview = async (id: number) => {
    if (window.confirm("정말로 이 리뷰를 삭제하시겠습니까?")) {
      await deleteReviewMutation(id);
    }
  };

  const handleEditReview = (id: number) => {
    if (window.confirm("리뷰를 수정하시겠습니까?")) {
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
