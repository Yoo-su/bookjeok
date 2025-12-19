import { Skeleton } from "@/shared/components/shadcn/skeleton";

/**
 * 관련 리뷰 섹션 스켈레톤
 */
export const RelatedReviewsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex h-[180px] bg-white rounded-xl overflow-hidden border border-stone-100"
        >
          {/* 이미지 스켈레톤 */}
          <Skeleton className="w-[120px] h-full shrink-0" />

          {/* 콘텐츠 스켈레톤 */}
          <div className="flex-1 flex flex-col p-3">
            <Skeleton className="h-3 w-20 mb-1" />
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-auto" />
            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
