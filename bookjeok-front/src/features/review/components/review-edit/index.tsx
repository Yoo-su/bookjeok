"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Book } from "@/features/book/types";
import { getReview } from "@/features/review/apis";
import { ReviewForm } from "@/features/review/components/review-form";
import { useUpdateReviewMutation } from "@/features/review/mutations";
import { ReviewFormValues } from "@/features/review/types";
import { Spinner } from "@/shared/components/shadcn/spinner";
import { PATHS } from "@/shared/constants/paths";

interface ReviewEditProps {
  id: number;
}

export const ReviewEdit = ({ id }: ReviewEditProps) => {
  const router = useRouter();

  const [initialData, setInitialData] = useState<{
    title: string;
    content: string;
    bookIsbn: string;
    category: string;
    tags: string[];
    rating: number;
    book?: Book;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    mutateAsync: updateReview,
    isPending: isSubmitting,
    isSuccess,
  } = useUpdateReviewMutation();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const review = await getReview(id);
        const bookData = review.book;

        setInitialData({
          title: review.title,
          content: review.content,
          bookIsbn: review.bookIsbn,
          category: review.category || "",
          tags: review.tags || [],
          rating: review.rating || 0,
          book: bookData,
        });
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        toast.error(error.message);
        router.push(PATHS.MY_PAGE);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleSubmit = async (
    data: ReviewFormValues,
    deletedImageUrls?: string[]
  ) => {
    await updateReview({ id, data, deletedImageUrls });
    router.push(PATHS.REVIEW_DETAIL(id));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!initialData) {
    return null;
  }

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
