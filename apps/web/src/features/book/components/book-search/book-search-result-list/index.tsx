"use client";

import { BookInfo } from "@bookjeok/core";
import { useInfiniteBookSearch } from "@bookjeok/react-query";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { Loader2 } from "@/shared/components/icons/iconsax";
import { cn } from "@/shared/utils/cn";

import { BookCard } from "../../common/book-card";
import { BookSearchResultListSkeleton } from "./skeleton";

interface BookSearchResultListProps {
  /** 쿼리 파라미터 이름 (기본값: "q") */
  paramName?: string;
}

/**
 * 도서 검색 결과 목록
 * - URL search params에서 검색어를 읽어 쿼리 실행
 * - 무한 스크롤 지원
 */
export const BookSearchResultList = ({
  paramName = "q",
}: BookSearchResultListProps) => {
  const t = useTranslations("book.search");
  const searchParams = useSearchParams();
  const query = searchParams.get(paramName) || "";

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

  // Case 1: 최초 로딩 상태 (첫 페이지를 불러오는 중, 이전 데이터 없음)
  if (status === "pending" && isFetching && !isFetchingNextPage && !data) {
    return <BookSearchResultListSkeleton />;
  }

  // Case 2: 에러 발생
  if (status === "error") {
    return (
      <div className="text-center text-red-500">
        {t("error", { message: error.message })}
      </div>
    );
  }

  // Case 3: 검색 결과가 없는 경우
  if (query && status === "success" && data?.pages[0].items.length === 0) {
    return (
      <div className="py-20 text-center text-gray-500">
        <p className="text-lg">{t("no_results", { query })}</p>
        <p className="mt-2 text-sm">{t("check_typo")}</p>
      </div>
    );
  }

  // Case 4: 검색 전 초기 상태
  if (!query) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p className="text-lg">{t("empty_state")}</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
  };

  const isTransitioning =
    isFetching && !isFetchingNextPage && status === "success";

  return (
    <div
      className={cn(
        "transition-opacity duration-300",
        isTransitioning && "opacity-40 pointer-events-none",
      )}
    >
      <div className="grid gap-x-4 gap-y-6 grid-cols-2 sm:grid-cols-4">
        {data?.pages.map((page, pageIndex: number) => (
          <motion.div
            key={`page-${pageIndex}`}
            className="col-span-full grid gap-x-4 gap-y-6 grid-cols-2 sm:grid-cols-4"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {page.items?.map((book: BookInfo, bookIndex: number) => (
              <motion.div
                key={book.isbn || `book-${pageIndex}-${bookIndex}`}
                variants={itemVariants}
              >
                <BookCard book={book} />
              </motion.div>
            ))}
          </motion.div>
        ))}
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
          <p>{t("all_loaded")}</p>
        </div>
      )}
    </div>
  );
};
