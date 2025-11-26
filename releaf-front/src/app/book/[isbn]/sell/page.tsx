// app/your-route/[isbn]/page.tsx

import { AuthGuard } from "@/features/auth/components/auth-guard";
import { DefaultLayout } from "@/layouts/default-layout";
import { BookSellView } from "@/views/book-sale-form-view";

export default async function Page({
  params,
}: {
  params: Promise<{ isbn: string }>;
}) {
  const { isbn } = await params;
  return (
    <AuthGuard>
      <DefaultLayout>
        <BookSellView isbn={isbn} />
      </DefaultLayout>
    </AuthGuard>
  );
}
