import { AuthGuard } from "@/features/auth/components/auth-guard";
import { DefaultLayout } from "@/layouts/default-layout";
import { BookSaleDetailView } from "@/views/book-sale-detail-view";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AuthGuard>
      <DefaultLayout>
        <BookSaleDetailView saleId={id} />
      </DefaultLayout>
    </AuthGuard>
  );
}
