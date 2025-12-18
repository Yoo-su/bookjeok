import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const ArtDetailSkeleton = () => (
  <div className="w-full animate-pulse bg-stone-50 min-h-screen">
    {/* 히어로 섹션 스켈레톤 - 새로운 레이아웃 */}
    <div className="relative min-h-[500px] lg:min-h-[600px] bg-white overflow-hidden">
      {/* 포스터 배경 */}
      <div className="absolute inset-0 lg:w-2/3">
        <Skeleton className="w-full h-full bg-stone-100" />
      </div>

      {/* 그라디언트 오버레이 모방 */}
      <div className="hidden lg:block absolute inset-0 bg-linear-to-r from-transparent via-white/70 to-white" />

      {/* 콘텐츠 영역 */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 h-full">
        <div className="flex flex-col lg:flex-row lg:items-center min-h-[500px] lg:min-h-[600px]">
          {/* 좌측 여백 */}
          <div className="hidden lg:block lg:w-1/3" />

          {/* 정보 영역 */}
          <div className="flex-1 py-10 lg:py-16 lg:pl-12">
            <div className="max-w-lg space-y-4">
              {/* 배지 */}
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full bg-stone-200" />
                <Skeleton className="h-6 w-14 rounded-full bg-stone-200" />
              </div>

              {/* 타이틀 */}
              <Skeleton className="h-12 w-4/5 bg-stone-200 rounded" />
              <Skeleton className="h-10 w-3/5 bg-stone-200 rounded" />

              {/* 장소 */}
              <Skeleton className="h-6 w-1/2 bg-stone-200 rounded" />

              {/* 간략 정보 카드 */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Skeleton className="h-20 w-full bg-stone-100 rounded-xl" />
                <Skeleton className="h-20 w-full bg-stone-100 rounded-xl" />
              </div>

              {/* 버튼 */}
              <Skeleton className="h-12 w-32 bg-stone-200 rounded-full mt-4" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* 콘텐츠 섹션 스켈레톤 */}
    <div className="max-w-7xl mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Skeleton className="h-8 w-32 bg-stone-100 rounded" />
        <Skeleton className="h-64 w-full bg-stone-100 rounded-2xl" />
        <Skeleton className="h-8 w-24 bg-stone-100 rounded" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full bg-stone-100 rounded" />
          <Skeleton className="h-4 w-full bg-stone-100 rounded" />
          <Skeleton className="h-4 w-5/6 bg-stone-100 rounded" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-28 w-full bg-stone-100 rounded-xl" />
        <Skeleton className="h-28 w-full bg-stone-100 rounded-xl" />
        <Skeleton className="h-28 w-full bg-stone-100 rounded-xl" />
        <Skeleton className="h-28 w-full bg-stone-100 rounded-xl" />
      </div>
    </div>
  </div>
);
