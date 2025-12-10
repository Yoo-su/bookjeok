import { Separator } from "@/shared/components/shadcn/separator";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

// 로딩 상태를 표시할 스켈레톤 UI
export const BookDetailSkeleton = () => (
  <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
    {/* 이미지 스켈레톤 */}
    <div className="md:col-span-1">
      <Skeleton className="w-full rounded-lg aspect-3/4" />
    </div>
    {/* 정보 스켈레톤 */}
    <div className="flex flex-col gap-4 md:col-span-2">
      <Skeleton className="w-24 h-6" />
      <Skeleton className="w-3/4 h-10" />
      <Skeleton className="w-1/2 h-6" />
      <Skeleton className="w-1/3 h-8 mt-2" />
      <Separator className="my-4" />
      <div className="flex gap-2">
        <Skeleton className="w-32 h-10" />
        <Skeleton className="w-32 h-10" />
      </div>
      <Separator className="my-4" />
      <div className="space-y-2">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-2/3 h-4" />
      </div>
    </div>
  </div>
);
