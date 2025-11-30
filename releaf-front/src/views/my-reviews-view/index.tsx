"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { useAuthStore } from "@/features/auth/store";
import { ReviewGridList } from "@/features/review/components/review-grid-list";
import {
  useDeleteReviewMutation,
  useReviewsInfiniteQuery,
} from "@/features/review/queries";
import { PATHS } from "@/shared/constants/paths";

export default function MyReviewsPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isReviewsLoading,
  } = useReviewsInfiniteQuery({
    userId: user?.id,
    enabled: !!user,
  });

  const deleteReviewMutation = useDeleteReviewMutation();

  useEffect(() => {
    if (!user) {
      router.push(PATHS.LOGIN);
    }
  }, [user, router]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const handleDeleteReview = async (id: number) => {
    if (window.confirm("정말로 이 리뷰를 삭제하시겠습니까?")) {
      try {
        await deleteReviewMutation.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete review:", error);
        alert("리뷰 삭제에 실패했습니다.");
      }
    }
  };

  const handleEditReview = (id: number) => {
    router.push(PATHS.REVIEW_EDIT(id));
  };

  if (isReviewsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const reviews = data?.pages.flatMap((page) => page.reviews) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">내가 쓴 리뷰</h1>
      <ReviewGridList
        reviews={reviews}
        searchQuery=""
        category={null}
        clearFilters={() => {}}
        loadMoreRef={ref}
        isFetchingNextPage={isFetchingNextPage}
        onDeleteReview={handleDeleteReview}
        onEditReview={handleEditReview}
      />
    </div>
  );
}
