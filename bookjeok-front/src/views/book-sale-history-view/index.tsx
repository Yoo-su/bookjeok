"use client";

import { BookSaleHistoryList } from "@/features/book/components/book-sale-history-list";

export const BookSaleHistoryView = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 py-4">나의 판매 내역</h1>
      <BookSaleHistoryList />
    </div>
  );
};
