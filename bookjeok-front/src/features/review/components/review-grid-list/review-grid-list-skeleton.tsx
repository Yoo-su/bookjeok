import { ReviewCardSkeleton } from "../review-card/skeleton";

export function ReviewGridListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
      {[...Array(6)].map((_, i) => (
        <ReviewCardSkeleton key={i} />
      ))}
    </div>
  );
}
