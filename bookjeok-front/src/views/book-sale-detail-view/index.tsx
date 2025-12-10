"use client";

import { BookSaleDetail } from "@/features/book/components/book-sale-detail";

interface BookSaleDetailViewProps {
  saleId: string;
}

export const BookSaleDetailView = ({ saleId }: BookSaleDetailViewProps) => {
  return <BookSaleDetail saleId={saleId} />;
};
