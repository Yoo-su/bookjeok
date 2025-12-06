import { BookCard } from "../../common/book-card";

export const BookSearchResultListSkeleton = () => {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <BookCard.Skeleton key={i} />
      ))}
    </div>
  );
};
