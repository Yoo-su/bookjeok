"use client";

import { AlertTriangle } from "lucide-react";

import { BookSaleHistoryList } from "@/features/book/components/book-sale-history-list";
import { useMyBookSalesQuery } from "@/features/book/queries";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const BookSaleHistoryView = () => {
  const { data: sales, isLoading, isError } = useMyBookSalesQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="w-full h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-red-500 bg-red-50 p-8 rounded-lg">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p className="font-semibold">오류 발생</p>
        <p className="text-sm">판매 내역을 불러오는 중 문제가 발생했습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 py-4">나의 판매 내역</h1>
      <BookSaleHistoryList sales={sales || []} />
    </div>
  );
};
