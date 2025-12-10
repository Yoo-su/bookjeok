import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const BookSaleHistoryListSkeleton = () => {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="w-full h-32 rounded-lg" />
      ))}
    </div>
  );
};
