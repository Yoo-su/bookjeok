import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const ChatListSkeleton = () => (
  <div className="p-4 space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-grow space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);
