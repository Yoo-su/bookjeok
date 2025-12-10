import { Skeleton } from "@/shared/components/shadcn/skeleton";

import { ReviewCardSkeleton } from "../review-card/skeleton";

export function ReviewFeedListSkeleton() {
  return (
    <div className="space-y-16">
      {/* 2개의 섹션 정도를 스켈레톤으로 보여줌 */}
      {[...Array(2)].map((_, sectionIndex) => (
        <div key={sectionIndex} className="review-feed-section">
          <div className="flex items-center justify-between mb-6 px-1">
            {/* 섹션 제목 스켈레톤 */}
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-5 w-12" />
          </div>

          {/* 슬라이더 대신 가로 스크롤 느낌의 Flex 배치 */}
          <div className="flex gap-4 overflow-hidden pb-12 px-1">
            {[...Array(3)].map((_, cardIndex) => (
              <div key={cardIndex} className="w-[280px] sm:w-[320px] shrink-0">
                <ReviewCardSkeleton />
              </div>
            ))}
            {/* 잘린 느낌을 주기 위해 반만 걸친 스켈레톤 */}
            <div className="w-[100px] shrink-0 opacity-50 overflow-hidden">
              <ReviewCardSkeleton />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
