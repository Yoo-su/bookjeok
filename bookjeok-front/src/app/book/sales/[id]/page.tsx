import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";
import { cache } from "react";

import { getBookSaleDetail } from "@/features/book/apis";
import { BookSaleJsonLd } from "@/features/book/components/book-sale-json-ld";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { getQueryClient } from "@/shared/libs/query-client";
import { BookSaleDetailView } from "@/views/book-sale-detail-view";

// 판매 상태 변경이 빠르게 반영되도록 1분 간격으로 재검증
export const revalidate = 60;

type Props = {
  params: Promise<{ id: string }>;
};

// React.cache를 사용하여 API 요청 중복 제거
const getCachedBookSale = cache(async (id: string) => {
  return await getBookSaleDetail(id);
});

// 동적 메타데이터 생성
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const sale = await getCachedBookSale(id);

  if (!sale) {
    return {
      title: "판매글을 찾을 수 없습니다",
      description: "요청하신 판매글이 존재하지 않습니다.",
    };
  }

  const title = sale.title;
  const description = `${sale.book.title} | ${sale.price.toLocaleString()}원 | ${sale.city} ${sale.district}`;
  const images =
    sale.imageUrls.length > 0
      ? [sale.imageUrls[0]]
      : sale.book.image
        ? [sale.book.image]
        : [];

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
  const queryClient = getQueryClient();

  // 캐시된 API 호출 (generateMetadata와 공유, 중복 호출 없음)
  const sale = await getCachedBookSale(id);

  // 이미 가져온 데이터를 QueryClient에 직접 설정 (추가 API 호출 없음)
  if (sale) {
    queryClient.setQueryData(QUERY_KEYS.bookKeys.saleDetail(id).queryKey, sale);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {sale && <BookSaleJsonLd sale={sale} />}
      <BookSaleDetailView saleId={id} />
    </HydrationBoundary>
  );
}
