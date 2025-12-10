import { Metadata } from "next";

import { AuthGuard } from "@/features/auth/components/auth-guard";
import { BookSaleHistoryView } from "@/views/book-sale-history-view";

export const metadata: Metadata = {
  title: "판매 내역",
  description: "내가 등록한 중고 서적 판매 내역입니다.",
};

export default function Page() {
  return (
    <AuthGuard>
      <BookSaleHistoryView />
    </AuthGuard>
  );
}
