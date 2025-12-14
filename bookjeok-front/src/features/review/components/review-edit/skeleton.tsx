"use client";

import { Skeleton } from "@/shared/components/shadcn/skeleton";

/**
 * 리뷰 편집 폼의 스켈레톤 컴포넌트
 * ReviewForm과 유사한 레이아웃으로 로딩 상태를 표시합니다.
 */
export const ReviewEditSkeleton = () => {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* 제목 */}
      <Skeleton className="h-9 w-48 mb-8" />

      <div className="space-y-8">
        {/* 책 선택 영역 */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-20" />
          <div className="flex items-center p-6 border rounded-xl gap-6">
            <Skeleton className="w-24 h-36 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>

        {/* 카테고리 및 별점 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* 제목 입력 */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-14 w-full" />
        </div>

        {/* 태그 입력 */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-16" />
          </div>
        </div>

        {/* 에디터 영역 */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Skeleton className="h-11 w-20" />
          <Skeleton className="h-11 w-28" />
        </div>
      </div>
    </div>
  );
};
