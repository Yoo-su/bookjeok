import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const ArtSliderSkeleton = () => {
  return (
    <div className="px-8 w-full overflow-hidden">
      <div className="flex flex-row gap-6 animate-pulse">
        {[...Array(5)].map((_, index) => (
          <Skeleton
            key={index}
            className="w-[280px] h-[380px] rounded-xl shrink-0 bg-white/10"
          />
        ))}
      </div>
    </div>
  );
};
