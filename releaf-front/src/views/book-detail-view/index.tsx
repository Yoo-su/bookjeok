import { BookDetail } from "@/features/book/components/book-detail/book-detail";
import { RelatedSales } from "@/features/book/components/related-sales";

export const BookDetailView = ({ isbn }: { isbn: string }) => {
  return (
    <div className="flex flex-col w-full py-8">
      <BookDetail />
      <RelatedSales isbn={isbn} />
    </div>
  );
};
