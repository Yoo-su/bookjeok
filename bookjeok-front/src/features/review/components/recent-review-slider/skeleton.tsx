import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const RecentReviewSliderSkeleton = () => {
  return (
    <div className="w-full overflow-hidden px-4">
      <div className="flex gap-5 justify-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[260px] h-[340px] rounded-2xl bg-stone-100 overflow-hidden"
          >
            {/* 상단 책 이미지 영역 */}
            <div className="flex justify-center pt-6">
              <Skeleton className="w-24 h-36 rounded-lg" />
            </div>

            {/* 하단 텍스트 영역 */}
            <div className="p-5 pt-6 space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2 mt-2" />

              {/* 태그 */}
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>

              {/* 작성자 정보 */}
              <div className="flex items-center gap-2 pt-4">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
