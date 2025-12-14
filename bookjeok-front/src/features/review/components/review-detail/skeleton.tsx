"use client";

import { Skeleton } from "@/shared/components/shadcn/skeleton";

/**
 * 리뷰 상세 페이지의 스켈레톤 컴포넌트
 * ReviewDetailHeader, ReviewDetailContent, ReviewDetailActions와 유사한 레이아웃
 */
export const ReviewDetailSkeleton = () => {
  return (
    <article className="min-h-screen bg-white pb-20">
      {/* Header 스켈레톤 */}
      <header className="relative bg-stone-50 border-b border-stone-100 pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          {/* 카테고리 및 별점 */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>

          {/* 제목 */}
          <Skeleton className="h-12 w-3/4 mx-auto mb-6" />

          {/* 태그 */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-14 rounded-full" />
          </div>

          {/* 작성자 정보 */}
          <div className="flex items-center justify-center gap-6 mb-10">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="w-1 h-1 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="w-1 h-1 rounded-full" />
            <Skeleton className="h-4 w-12" />
          </div>

          {/* 책 정보 카드 */}
          <div className="inline-flex items-center gap-4 bg-white p-3 pr-6 rounded-xl shadow-sm border border-stone-100 mx-auto">
            <Skeleton className="w-12 h-16 rounded-md shrink-0" />
            <div className="text-left space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </header>

      {/* Content 및 Actions 스켈레톤 */}
      <div className="container mx-auto px-4 max-w-4xl py-16">
        {/* 콘텐츠 영역 */}
        <div className="space-y-4 mb-12">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>

        {/* 액션 버튼 영역 */}
        <div className="flex items-center justify-center gap-4 pt-8 border-t border-stone-100">
          <Skeleton className="h-10 w-20 rounded-full" />
          <Skeleton className="h-10 w-20 rounded-full" />
          <Skeleton className="h-10 w-20 rounded-full" />
        </div>
      </div>
    </article>
  );
};
