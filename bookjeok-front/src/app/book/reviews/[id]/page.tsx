import { Metadata } from "next";
import { cache } from "react";

import { getReview } from "@/features/review/apis";
import { ReviewDetailView } from "@/views/review-detail-view";

interface Props {
  params: Promise<{ id: string }>;
}

// React.cache를 사용하여 API 요청 중복 제거 (Request Memoization)
// generateMetadata와 페이지 컴포넌트에서 동일한 함수를 호출하더라도 실제 API 요청은 한 번만 발생합니다.
const getCachedReview = cache(async (id: number) => {
  return await getReview(id);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const reviewId = Number(id);

  // 캐시된 API 함수 호출
  const review = await getCachedReview(reviewId);

  if (!review) {
    return {
      title: "리뷰를 찾을 수 없습니다",
      description: "요청하신 리뷰가 존재하지 않습니다.",
    };
  }

  const title = review.title;
  // HTML 태그가 포함된 content 대신, 책 제목과 리뷰 제목을 조합하여 깔끔하게 표시
  const description = `${review.book.title} - ${review.book.author}`;
  const images = review.book.image ? [review.book.image] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const reviewId = Number(id);

  // 캐시된 API 함수 호출 (이미 generateMetadata에서 호출되었다면 캐시된 데이터 사용)
  const initialReview = await getCachedReview(reviewId);

  return <ReviewDetailView initialReview={initialReview} />;
}
