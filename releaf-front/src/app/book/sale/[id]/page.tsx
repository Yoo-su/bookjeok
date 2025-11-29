import { AuthGuard } from "@/features/auth/components/auth-guard";
import { BookSaleDetailView } from "@/views/book-sale-detail-view";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AuthGuard>
      <BookSaleDetailView saleId={id} />
    </AuthGuard>
  );
}
