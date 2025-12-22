import { BookDetail } from "@/features/book/components/book-detail";
import { RelatedReviews } from "@/features/book/components/related-reviews";
import { RelatedSales } from "@/features/book/components/related-sales";
import { CommentSection } from "@/features/comment/components/comment-section";
import { CommentTargetType } from "@/features/comment/types";

export const BookDetailView = ({ isbn }: { isbn: string }) => {
  return (
    <div className="flex flex-col w-full py-8">
      <BookDetail isbn={isbn} />
      <RelatedSales isbn={isbn} />
      <CommentSection targetType={CommentTargetType.BOOK} targetId={isbn} />
      <RelatedReviews isbn={isbn} />
    </div>
  );
};
