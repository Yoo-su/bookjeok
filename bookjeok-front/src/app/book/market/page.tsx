import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";

import { getPopularBookSales, searchBookSales } from "@/features/book/apis";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { getQueryClient } from "@/shared/libs/query-client";
import { BookMarketView } from "@/views/book-market-view";

export const metadata: Metadata = {
  title: "중고 서적 마켓",
  description: "다양한 중고 서적을 탐색하고 저렴하게 구매해보세요.",
};

export default async function Page() {
  const queryClient = getQueryClient();

  // 인기 판매글 및 초기 판매글 목록 prefetch
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.bookKeys.popularSales.queryKey,
      queryFn: getPopularBookSales,
    }),
    queryClient.prefetchInfiniteQuery({
      queryKey: QUERY_KEYS.bookKeys.marketSales({}).queryKey,
      queryFn: ({ pageParam = 1 }) => searchBookSales({ page: pageParam }),
      initialPageParam: 1,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BookMarketView />
    </HydrationBoundary>
  );
}
