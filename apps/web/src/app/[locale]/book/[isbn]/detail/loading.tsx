import { BookDetailSkeleton } from "@/features/book/components/book-detail/skeleton";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

/**
 * 도서 상세 내비게이션 로딩 UI
 *
 * 목록 링크가 `prefetch={false}`라 클릭 시점에 페이로드를 받아온다.
 * 그 구간이 무반응으로 보이지 않게 실제 레이아웃과 같은 골격을 그린다.
 * 상단 격자는 `BookDetail`이 쓰는 스켈레톤을 그대로 재사용해 전환 시 튀지 않게 한다.
 *
 * 카드 골격은 `BookCard.Skeleton`을 쓰지 않고 직접 그린다. `BookCard`는
 * "use client" 모듈이라 서버 컴포넌트에서 점 접근하면 런타임에 터진다.
 */
const CardSkeleton = () => (
  <div className="block">
    <div className="relative w-full aspect-3/4 overflow-hidden rounded-sm bg-stone-100 shadow-md animate-pulse" />
    <div className="mt-2.5 px-0.5 space-y-1.5">
      <Skeleton className="h-4 w-3/4 bg-stone-200/60" />
      <Skeleton className="h-3 w-1/2 bg-stone-200/40" />
    </div>
  </div>
);

export default function Loading() {
  return (
    <div className="flex flex-col w-full py-8 max-w-5xl mx-auto px-4 sm:px-6">
      <section className="w-full">
        <BookDetailSkeleton />

        {/* 연관 도서 (RelatedBooksSection) */}
        <div className="h-px bg-stone-100 my-8" />
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* AI 요약 (AISummary의 미요청 상태와 같은 중앙 정렬 블록) */}
        <div className="h-px bg-stone-100 my-8" />
        <div className="py-12 flex flex-col items-center text-center space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-full max-w-2xl" />
          <Skeleton className="h-7 w-2/3 max-w-lg" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-11 w-40 rounded-full mt-2" />
        </div>
      </section>
    </div>
  );
}
