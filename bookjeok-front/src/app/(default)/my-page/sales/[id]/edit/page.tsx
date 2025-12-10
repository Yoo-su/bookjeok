import { AuthGuard } from "@/features/auth/components/auth-guard";
import { BookSaleEditView } from "@/views/book-sale-edit-view"; // 새로 만들 View

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AuthGuard>
      <BookSaleEditView saleId={id} />
    </AuthGuard>
  );
}
