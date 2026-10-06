"use client";

import { BookInfo, FeedbackType } from "@bookjeok/core";
import { useInfiniteBookSearch } from "@bookjeok/react-query";
import { motion, type Variants } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

import { FeedbackButton } from "@/features/feedback/components/feedback-button";
import { Loader2 } from "@/shared/components/icons/iconsax";
import { cn } from "@/shared/utils/cn";

import { BookCard } from "../../common/book-card";
import { BookSearchResultListSkeleton } from "./skeleton";

/** 처음 몇 장만 차례로, 그 뒤는 한꺼번에. 한 쪽(20권)을 다 차례로 세우면 끝이 너무 늦다 */
const STAGGER_COUNT = 8;

// custom = 차례(0부터). 다음 쪽은 0으로 받아 한꺼번에 나타남
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (order: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: "easeOut",
      delay: Math.min(order, STAGGER_COUNT) * 0.04,
    },
  }),
};

interface BookSearchResultListProps {
  /** 쿼리 파라미터 이름 (기본값: "q") */
  paramName?: string;
  /** 넘기면 URL 대신 이 검색어로 찾는다 */
  query?: string;
}

/**
 * 도서 검색 결과 목록
 * - URL search params에서 검색어를 읽어 쿼리 실행
 * - 무한 스크롤 지원
 */
export const BookSearchResultList = ({
  paramName = "q",
  query: queryProp,
}: BookSearchResultListProps) => {
  const t = useTranslations("book.search");
  const tFeedback = useTranslations("feedback");
  const searchParams = useSearchParams();
  const query = queryProp ?? (searchParams.get(paramName) || "");

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isPlaceholderData,
    status,
  } = useInfiniteBookSearch(query);

  // 그리고 있는 결과의 검색어. 새 검색어 결과가 도착해야 바뀌어 목록을 새로 세운다.
  // 처음부터 캐시에 있던 결과(뒤로 가기 등)는 움직이지 않고, 그 뒤 받은 쪽만 나타나게 한다
  const ready = status === "success" && !isPlaceholderData;
  const [shown, setShown] = useState(() => ({
    query: ready ? query : null,
    swapped: false,
    cachedPages: ready ? (data?.pages.length ?? 0) : 0,
  }));
  if (ready && shown.query !== query) {
    setShown({ query, swapped: true, cachedPages: 0 });
  }

  // 바닥에 닿기 전에 미리 불러와 로딩 표시가 하단 검색 알약에 가리지 않게 함
  const { ref, inView } = useInView({
    threshold: 0,
    delay: 100,
    rootMargin: "0px 0px 600px 0px",
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
        <FeedbackButton
          preset={{ type: FeedbackType.BOOK_REQUEST, bookTitle: query }}
          className="mt-6 inline-flex h-10 items-center rounded-full border border-stone-300 px-5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-500 hover:text-stone-900"
        >
          {tFeedback("request_book")}
        </FeedbackButton>
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

  const isTransitioning =
    isFetching && !isFetchingNextPage && status === "success";

  return (
    <div
      className={cn(
        "transition-opacity duration-300",
        isTransitioning && "opacity-40 pointer-events-none",
      )}
    >
      <div
        key={shown.query ?? ""}
        className="grid gap-x-4 gap-y-6 grid-cols-2 sm:grid-cols-4"
      >
        {data?.pages.map((page, pageIndex: number) => {
          const animate = shown.swapped || pageIndex >= shown.cachedPages;
          return page.items?.map((book: BookInfo, bookIndex: number) => (
            <motion.div
              // 쪽마다 따로 받으니 같은 책이 두 쪽에 올 수 있어 쪽 번호를 붙임
              key={`${pageIndex}-${book.isbn || bookIndex}`}
              custom={pageIndex === 0 ? bookIndex : 0}
              variants={itemVariants}
              initial={animate ? "hidden" : false}
              animate="visible"
            >
              <BookCard book={book} />
            </motion.div>
          ));
        })}
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
