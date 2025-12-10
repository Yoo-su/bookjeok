import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const WishlistSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="w-full h-32 rounded-lg" />
      ))}
    </div>
  );
};
