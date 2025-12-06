import { Skeleton } from "@/shared/components/shadcn/skeleton";

export function ReviewCardSkeleton() {
  return (
    <div className="flex h-[180px] bg-white rounded-xl overflow-hidden border border-stone-100 shadow-sm">
      {/* 이미지 컨테이너 (좌측) */}
      <Skeleton className="w-[120px] h-full shrink-0" />

      {/* 콘텐츠 (우측) */}
      <div className="flex-1 flex flex-col p-3 min-w-0">
        <div className="flex flex-col gap-1.5 mb-2">
          {/* 저자 */}
          <Skeleton className="h-3 w-20" />
          {/* 날짜 & 별점 */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>

        {/* 제목 */}
        <div className="mb-2">
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* 태그 */}
        <div className="flex gap-1 mb-auto mt-2">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>

        {/* 유저 정보 (하단) */}
        <div className="mt-2 pt-2 border-t border-stone-100 flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}
