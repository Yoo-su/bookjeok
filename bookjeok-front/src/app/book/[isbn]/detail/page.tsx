import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";

import { fetchBookDetail } from "@/features/book/server/service";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { getQueryClient } from "@/shared/libs/query-client";
import { BookDetailView } from "@/views/book-detail-view";

export const metadata: Metadata = {
  title: "도서 상세",
  description: "도서 상세 정보를 확인하세요.",
};

type Props = {
  params: Promise<{ isbn: string }>;
};

export default async function Page({ params }: Props) {
  const { isbn } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.bookKeys.detail(isbn).queryKey,
    queryFn: async () => {
      const response = await fetchBookDetail(isbn);
      if (!response.success) return null;
      return response.data.items[0];
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BookDetailView isbn={isbn} />
    </HydrationBoundary>
  );
}
