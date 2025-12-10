"use client";

import { AlertTriangle, BookX } from "lucide-react";

import { useMyBookSalesQuery } from "@/features/book/queries";

import { BookSaleHistoryItem } from "./item";
import { BookSaleHistoryListSkeleton } from "./skeleton";

export const BookSaleHistoryList = () => {
  const { data: sales, isLoading, isError } = useMyBookSalesQuery();

  if (isLoading) {
    return <BookSaleHistoryListSkeleton />;
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

  if (!sales || sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50 p-8 rounded-lg">
        <BookX className="w-12 h-12 mb-4" />
        <p className="font-semibold">판매 내역이 없습니다.</p>
        <p className="text-sm">새로운 중고책을 등록해보세요!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sales.map((sale) => (
        <BookSaleHistoryItem key={sale.id} sale={sale} />
      ))}
    </div>
  );
};
