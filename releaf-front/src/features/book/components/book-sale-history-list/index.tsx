import { BookX } from "lucide-react";

import { UsedBookSale } from "../../types";
import { BookSaleHistoryItem } from "./item";

interface BookSaleHistoryListProps {
  sales: UsedBookSale[];
}

export const BookSaleHistoryList = ({ sales }: BookSaleHistoryListProps) => {
  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50 p-8 rounded-lg">
        <BookX className="w-12 h-12 mb-4" />
        <p className="font-semibold">판매 내역이 없습니다.</p>
        <p className="text-sm">새로운 중고책을 등록해보세요!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sales.map((sale) => (
        <BookSaleHistoryItem key={sale.id} sale={sale} />
      ))}
    </div>
  );
};
