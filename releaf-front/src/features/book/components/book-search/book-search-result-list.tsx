"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { useInfiniteBookSearch } from "../../queries";
import { useBookSearchStore } from "../../stores/use-book-search-store";
import { BookCard } from "../common/book-card";

export const BookSearchResultList = () => {
  const query = useBookSearchStore((state) => state.query);
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteBookSearch(query);

  const { ref, inView } = useInView({
    threshold: 0,
    delay: 100,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching, fetchNextPage]);

  // Case 1: 최초 로딩 상태 (첫 페이지를 불러오는 중)
  if (status === "pending" && isFetching && !isFetchingNextPage) {
    return (
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <BookCard.Skeleton key={i} />
        ))}
      </div>
    );
  }

  // Case 2: 에러 발생
  if (status === "error") {
    return (
      <div className="text-center text-red-500">
        에러가 발생했습니다: {error.message}
      </div>
    );
  }

  // Case 3: 검색 결과가 없는 경우
  if (query && status === "success" && data?.pages[0].items.length === 0) {
    return (
      <div className="py-20 text-center text-gray-500">
        <p className="text-lg">'{query}'에 대한 검색 결과가 없습니다.</p>
        <p className="mt-2 text-sm">
          오타가 없는지 확인하거나 다른 검색어로 검색해보세요.
        </p>
      </div>
    );
  }

  // Case 4: 검색 전 초기 상태
  if (!query) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p className="text-lg">
          관심 있는 책을 검색하여 당신의 서재를 채워보세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-x-4 gap-y-8 grid-cols-2 sm:grid-cols-4">
        {data?.pages.flatMap((page, pageIndex) =>
          page.items.map((book, bookIndex) => (
            <BookCard
              key={book.isbn || `book-${pageIndex}-${bookIndex}`}
              book={book}
            />
          ))
        )}
      </div>

      {/* 다음 페이지를 불러오기 위한 트리거 요소 */}
      <div ref={ref} className="h-10" />

      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      )}

      {!hasNextPage && data && (
        <div className="py-10 text-center text-gray-500">
          <p>모든 검색 결과를 불러왔습니다.</p>
        </div>
      )}
    </div>
  );
};
