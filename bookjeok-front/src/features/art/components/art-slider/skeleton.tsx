import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const ArtSliderSkeleton = () => {
  return (
    <div className="px-8 w-full overflow-hidden">
      <div className="flex flex-row gap-5 animate-pulse">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="w-[300px] shrink-0 bg-white rounded-2xl overflow-hidden border border-stone-100"
          >
            {/* 포스터 영역 */}
            <Skeleton className="w-full aspect-3/4 bg-stone-100" />
            {/* 콘텐츠 영역 */}
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-4/5 bg-stone-100 rounded" />
              <Skeleton className="h-3 w-3/5 bg-stone-100 rounded" />
              <Skeleton className="h-3 w-2/5 bg-stone-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
