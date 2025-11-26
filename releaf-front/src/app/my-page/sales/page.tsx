import { AuthGuard } from "@/features/auth/components/auth-guard";
import { DefaultLayout } from "@/layouts/default-layout";
import { BookSaleHistoryView } from "@/views/book-sale-history-view";

export default function Page() {
  return (
    <AuthGuard>
      <DefaultLayout>
        <BookSaleHistoryView />
      </DefaultLayout>
    </AuthGuard>
  );
}
