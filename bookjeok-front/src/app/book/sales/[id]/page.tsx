import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import { getBookSaleDetail } from "@/features/book/apis";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { getQueryClient } from "@/shared/libs/query-client";
import { BookSaleDetailView } from "@/views/book-sale-detail-view";

export const metadata: Metadata = {
  title: "판매글 상세",
  description: "중고 서적 판매글입니다.",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  const queryClient = getQueryClient();

  // 서버에서 판매글 상세 정보 prefetch
  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.bookKeys.saleDetail(id).queryKey,
    queryFn: () => getBookSaleDetail(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AuthGuard>
        <BookSaleDetailView saleId={id} />
      </AuthGuard>
    </HydrationBoundary>
  );
}
