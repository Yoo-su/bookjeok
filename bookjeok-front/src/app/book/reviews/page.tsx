import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";

import { getPopularReviews, getReviewFeeds } from "@/features/review/apis";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { getQueryClient } from "@/shared/libs/query-client";
import { ReviewHomeView } from "@/views/review-home-view";

export const metadata: Metadata = {
  title: "도서 리뷰 | 베스트셀러 리뷰, 신간 서평 모음",
  description:
    "다양한 책에 대한 솔직한 리뷰와 별점을 확인하세요. 베스트셀러, 신간 도서의 생생한 독후감과 서평을 북적에서 만나보세요.",
  keywords: [
    "책 리뷰",
    "도서 리뷰",
    "독후감",
    "서평",
    "베스트셀러 리뷰",
    "신간 리뷰",
  ],
};

export default async function Page() {
  const queryClient = getQueryClient();

  // 인기 리뷰 및 피드 prefetch
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.reviewKeys.popular.queryKey,
      queryFn: getPopularReviews,
    }),
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.reviewKeys.feeds.queryKey,
      queryFn: getReviewFeeds,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReviewHomeView />
    </HydrationBoundary>
  );
}
