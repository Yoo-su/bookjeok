import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const ChatRoomSkeleton = () => {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* 헤더 Skeleton */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      {/* 메시지 Skeleton */}
      <div className="grow p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`flex gap-2 ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
          >
            {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            <Skeleton className="h-10 w-[60%] rounded-2xl" />
          </div>
        ))}
      </div>

      {/* 입력창 Skeleton */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Skeleton className="h-10 grow rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
    </div>
  );
};
