"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

import { BookSaleEditForm } from "@/features/book/components/book-sale-edit-form";
import { useBookSaleDetailQuery } from "@/features/book/queries";

interface BookSaleEditProps {
  saleId: string;
}

export const BookSaleEdit = ({ saleId }: BookSaleEditProps) => {
  const { data: sale, isLoading, isError } = useBookSaleDetailQuery(saleId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (isError || !sale) {
    return (
      <div className="py-20 text-center text-red-500">
        <AlertTriangle className="mx-auto h-12 w-12" />
        <p className="mt-4 font-semibold">게시글 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return <BookSaleEditForm sale={sale} />;
};
