import { Skeleton } from "@/shared/components/shadcn/skeleton";

/** 책탑을 불러오는 동안. 코드 분할 로딩과 데이터 로딩이 같이 쓴다 */
export function TowerSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-16 w-64 rounded-xl" />
      <Skeleton className="h-[520px] w-full rounded-2xl" />
    </div>
  );
}
