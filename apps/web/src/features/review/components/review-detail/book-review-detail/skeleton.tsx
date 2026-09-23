"use client";

import { Skeleton } from "@/shared/components/shadcn/skeleton";

/**
 * 리뷰 상세 페이지의 스켈레톤 컴포넌트
 * ReviewDetailHeader, ReviewDetailContent, ReviewDetailActions와 유사한 레이아웃
 */
export const ReviewDetailSkeleton = () => {
  return (
    <article className="min-h-dvh bg-white pb-20">
      {/* Header 스켈레톤 - 실제 ReviewDetailHeader와 1:1 레이아웃 일치 */}
      <header className="relative bg-white pt-20 pb-12">
        <div className="container mx-auto px-4 w-full">
          {/* 카테고리 & 날짜 - 상단 메타데이터 */}
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-4 w-20" />
            <div className="h-3 w-px bg-stone-300" />
            <Skeleton className="h-4 w-28" />
          </div>

          {/* 메인 타이틀 */}
          <Skeleton className="h-10 md:h-14 w-3/4 mb-8" />

          {/* 작성자 정보 & 조회수 & 공유 버튼 */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-8 mb-10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="h-8 w-px bg-stone-200 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="w-4 h-4 rounded-sm" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>

            <Skeleton className="w-9 h-9 rounded-md" />
          </div>

          {/* 리뷰한 책 */}
          <div className="flex items-center gap-5 mb-8">
            <Skeleton className="aspect-[5/7] w-16 shrink-0 rounded-[2px] sm:w-[72px]" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-5 w-1/2 min-w-[140px] max-w-sm" />
              <Skeleton className="h-4 w-1/3 min-w-[100px] max-w-xs" />
            </div>
            <div className="hidden flex-col items-end gap-2 border-l border-stone-200 pl-6 sm:flex">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>

          {/* 태그 */}
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </header>

      {/* Content 및 Actions 스켈레톤 */}
      <div className="container mx-auto px-4 w-full py-16">
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
        <div className="flex flex-col items-center gap-4 pt-10 border-t border-stone-100">
          <Skeleton className="h-4 w-28" />
          <div className="flex flex-wrap justify-center gap-2">
            <Skeleton className="h-11 w-28 rounded-full" />
            <Skeleton className="h-11 w-28 rounded-full" />
            <Skeleton className="h-11 w-28 rounded-full" />
          </div>
        </div>
      </div>
    </article>
  );
};
