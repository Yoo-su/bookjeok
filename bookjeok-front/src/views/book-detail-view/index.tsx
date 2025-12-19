import { BookDetail } from "@/features/book/components/book-detail";
import { RelatedReviews } from "@/features/book/components/related-reviews";
import { RelatedSales } from "@/features/book/components/related-sales";

export const BookDetailView = ({ isbn }: { isbn: string }) => {
  return (
    <div className="flex flex-col w-full py-8">
      <BookDetail isbn={isbn} />
      <RelatedSales isbn={isbn} />
      <RelatedReviews isbn={isbn} />
    </div>
  );
};
