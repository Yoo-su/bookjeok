"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Book } from "@/features/book/types";
import { getReview, updateReview } from "@/features/review/apis";
import { ReviewForm } from "@/features/review/components/review-form";
import { ReviewFormValues } from "@/features/review/types";
import { Spinner } from "@/shared/components/shadcn/spinner";
import { PATHS } from "@/shared/constants/paths";

export const ReviewEditView = () => {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        alert(error.message);
        router.push(PATHS.MY_PAGE);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleSubmit = async (data: ReviewFormValues) => {
    setIsSubmitting(true);
    try {
      await updateReview(id, data);
      alert("리뷰가 수정되었습니다!");
      router.push(PATHS.REVIEW_DETAIL(id)); // 리뷰 상세 페이지로 리다이렉트
    } catch (error: any) {
      console.error("Review update error:", error);
      alert(error.message || "리뷰 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
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
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
