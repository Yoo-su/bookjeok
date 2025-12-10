import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const BookSaleDetailSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto py-12 px-4">
    {/* Image Gallery Skeleton */}
    <div className="flex flex-col gap-4">
      <Skeleton className="w-full aspect-square rounded-lg" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="w-20 h-20 rounded-md" />
        ))}
      </div>
    </div>
    {/* Info Skeleton */}
    <div className="flex flex-col space-y-6">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-12 w-1/2" />
      <div className="flex items-center space-x-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="pt-6">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  </div>
);
