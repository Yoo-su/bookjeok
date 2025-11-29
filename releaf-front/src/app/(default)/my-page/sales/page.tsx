import { AuthGuard } from "@/features/auth/components/auth-guard";
import { BookSaleHistoryView } from "@/views/book-sale-history-view";

export default function Page() {
  return (
    <AuthGuard>
      <BookSaleHistoryView />
    </AuthGuard>
  );
}
