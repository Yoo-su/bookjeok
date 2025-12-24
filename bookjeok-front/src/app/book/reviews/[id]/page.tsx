import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";
import { cache } from "react";

import { getReview } from "@/features/review/apis";
import { ReviewJsonLd } from "@/features/review/components/review-json-ld";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { getQueryClient } from "@/shared/libs/query-client";
import { ReviewDetailView } from "@/views/review-detail-view";

// 리뷰 내용은 자주 변경되지 않으므로 5분 간격으로 재검증
export const revalidate = 300;

interface Props {
  params: Promise<{ id: string }>;
}

// React.cache를 사용하여 API 요청 중복 제거 (Request Memoization)
const getCachedReview = cache(async (id: number) => {
  return await getReview(id);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const reviewId = Number(id);

  const review = await getCachedReview(reviewId);

  if (!review) {
    return {
      title: "리뷰를 찾을 수 없습니다",
      description: "요청하신 리뷰가 존재하지 않습니다.",
    };
  }

  const title = review.title;
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
  const queryClient = getQueryClient();

  // 캐시된 API 호출 (generateMetadata와 공유, 중복 호출 없음)
  const review = await getCachedReview(reviewId);

  // 이미 가져온 데이터를 QueryClient에 직접 설정 (추가 API 호출 없음)
  if (review) {
    queryClient.setQueryData(
      QUERY_KEYS.reviewKeys.detail(reviewId).queryKey,
      review
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {review && <ReviewJsonLd review={review} />}
      <ReviewDetailView initialReview={review} />
    </HydrationBoundary>
  );
}
