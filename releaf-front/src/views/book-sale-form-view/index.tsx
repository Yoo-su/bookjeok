// src/features/book/views/BookSellView.tsx
"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

import { BookSaleForm } from "@/features/book/components/book-sale-form";
import { useBookDetailQuery } from "@/features/book/queries";

interface BookSellViewProps {
  isbn: string;
}
export const BookSellView = ({ isbn }: BookSellViewProps) => {
  // isbn을 사용하여 판매할 책의 상세 정보를 가져옵니다.
  const { data: book, isLoading, isError } = useBookDetailQuery(isbn);

  // 1. 데이터를 불러오는 중일 때의 UI
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
        <p className="mt-4 text-lg text-gray-600">
          판매할 책 정보를 불러오는 중입니다...
        </p>
      </div>
    );
  }

  // 2. 데이터 조회에 실패했거나 책 정보가 없을 때의 UI
  if (isError || !book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center text-gray-500">
        <AlertTriangle className="w-12 h-12 mb-4 text-red-400" />
        <h2 className="text-xl font-semibold">책 정보를 불러올 수 없습니다.</h2>
        <p className="mt-2 text-sm">
          유효하지 않은 책이거나, 정보를 가져오는 데 실패했습니다.
        </p>
      </div>
    );
  }

  // 3. 성공적으로 데이터를 불러왔을 때 폼을 렌더링
  return (
    <div className="w-full py-8">
      <BookSaleForm bookInfo={book} />
    </div>
  );
};
