import { Card, CardContent, CardHeader } from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

function PopularReviewItemSkeleton() {
  return (
    <Card className="h-full border-stone-200 overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2 mb-2">
          {/* 뱃지 */}
          <Skeleton className="h-5 w-16" />
          {/* 조회수 */}
          <Skeleton className="h-4 w-10" />
        </div>
        {/* 제목 (2줄 고려) */}
        <Skeleton className="h-6 w-3/4 mb-1" />
        <Skeleton className="h-6 w-1/2" />
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {/* 본문 (2줄) */}
        <div className="hidden md:block space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* 푸터 (유저 & 좋아요) */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-100">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-8" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PopularReviewListSkeleton() {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <PopularReviewItemSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
