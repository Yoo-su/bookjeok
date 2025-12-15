import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";

import { getRecentBookSales } from "@/features/book/apis";
import { getReviews } from "@/features/review/apis";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { getQueryClient } from "@/shared/libs/query-client";
import { MainView } from "@/views/main-view";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "홈",
  description:
    "bookjeok의 홈 페이지입니다. 지금 가장 인기있는 중고 서적과 솔직한 도서 리뷰를 확인해보세요.",
};

export default async function Page() {
  const queryClient = getQueryClient();

  await Promise.all([
    // 최근 판매글 prefetch
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.bookKeys.recentSales.queryKey,
      queryFn: getRecentBookSales,
    }),
    // 최신 리뷰 prefetch (page: 1, limit: 10)
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.reviewKeys.list({ page: 1, limit: 10 }).queryKey,
      queryFn: () => getReviews({ page: 1, limit: 10 }),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MainView />
    </HydrationBoundary>
  );
}
