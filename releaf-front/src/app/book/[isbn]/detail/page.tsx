import { BookDetailView } from "@/views/book-detail-view";

export default async function Page({
  params,
}: {
  params: Promise<{ isbn: string }>;
}) {
  const { isbn } = await params;

  return <BookDetailView isbn={isbn} />;
}
