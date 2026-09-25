"use client";

import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const LoungeActiveReadersSkeleton = () => {
  return (
    <div className="w-full">
      {/* 헤더 스켈레톤 */}
      <div className="mb-10">
        <Skeleton className="h-7 w-48 mb-3" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* 테이블 리스트 스켈레톤 */}
      <div className="flex flex-col border-t border-stone-200/80">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-4 border-b border-stone-100 px-3 sm:px-5"
          >
            {/* 좌측 영역: 순위 + 아바타 + 닉네임 */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-full" />
              <Skeleton className="h-4 w-20 sm:w-28" />
            </div>

            {/* 우측 영역: 독서 지표 통계 */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex flex-col items-end gap-1.5">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="flex flex-col items-end gap-1.5 border-l border-stone-100 pl-4 sm:pl-6">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
