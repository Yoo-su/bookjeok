// app/your-route/[isbn]/page.tsx

import { AuthGuard } from "@/features/auth/components/auth-guard";
import { BookSellView } from "@/views/book-sale-form-view";

export default async function Page({
  params,
}: {
  params: Promise<{ isbn: string }>;
}) {
  const { isbn } = await params;
  return (
    <AuthGuard>
      <BookSellView isbn={isbn} />
    </AuthGuard>
  );
}
