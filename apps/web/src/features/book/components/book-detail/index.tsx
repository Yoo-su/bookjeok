"use client";
import { bookKeys } from "@bookjeok/core";
import {
  useBookDetailQuery,
  useBookSummaryQuery,
  useGenerateBookSummaryMutation,
} from "@bookjeok/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Separator } from "@/shared/components/shadcn/separator";

import { useBookView } from "../../hooks/use-book-view";
import { useRecentBookStore } from "../../stores/use-recent-book-store";
import { AISummary } from "./ai-summary";
import { BookActions } from "./book-actions";
import { BookCover } from "./book-cover";
import { BookDescription } from "./book-description";
import { BookInfo } from "./book-info";
import { BookDetailError } from "./error";
import { RelatedBooksSection } from "./related-books-section";
import { BookDetailSkeleton } from "./skeleton";

interface BookDetailProps {
  isbn: string;
}

export const BookDetail = ({ isbn }: BookDetailProps) => {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const {
    data: book,
    isLoading,
    isError,
    isSuccess,
  } = useBookDetailQuery(isbn);
  const addRecentBook = useRecentBookStore((state) => state.addRecentBook);
  const [isSummaryRequested, setIsSummaryRequested] = useState(false);

  // 책 상세페이지 조회수 기록 (버그 수정됨)
  useBookView(isbn);

  useEffect(() => {
    if (isSuccess && book) {
      addRecentBook(book);
    }
  }, [isSuccess, book, addRecentBook]);

  // 1. 이미 저장된 요약 정보 조회 (비인증 GET)
  const { data: savedSummary, isLoading: isSavedSummaryLoading } =
    useBookSummaryQuery(isbn);

  // 2. AI 요약 정보 생성 요청 Mutation (인증 POST)
  const {
    mutate: generateSummary,
    data: generatedSummary,
    isPending: isGenerating,
    isError: isGeneratingError,
  } = useGenerateBookSummaryMutation({
    onSuccess: (data) => {
      // 캐시 갱신
      queryClient.setQueryData(bookKeys.summary(isbn).queryKey, data);
    },
  });

  const summary = savedSummary || generatedSummary;
  const isSummaryLoading = isSavedSummaryLoading || isGenerating;
  const isSummaryError = isGeneratingError;
  const isRequested = isSummaryRequested || !!savedSummary;

  const handleRequestSummary = () => {
    if (!book) return;
    setIsSummaryRequested(true);
    generateSummary({
      title: book.title,
      author: book.author,
      description: book.description,
      isbn,
      publisher: book.publisher,
    });
  };

  if (isLoading) return <BookDetailSkeleton />;

  if (isError || !book) return <BookDetailError />;

  return (
    <section className="w-full overflow-visible">
      <div className="grid items-start md:grid-cols-3 gap-8 lg:gap-12 overflow-visible">
        <div className="w-full md:col-span-1 overflow-visible">
          <BookCover src={book.image} alt={book.title} />
        </div>

        <div className="flex flex-col h-full md:col-span-2">
          <BookInfo
            title={book.title}
            author={book.author}
            publisher={book.publisher}
            price={Number(book.discount)}
          />

          <div className="h-px bg-stone-100 my-6" />

          <BookActions book={{ ...book, isbn }} />

          <div className="h-px bg-stone-100 my-6" />

          <BookDescription description={book.description} />
        </div>
      </div>

      {book.publisher && (
        <>
          <Separator className="my-8" />
          <RelatedBooksSection
            title={t("book.detail.related_publisher_books_title", {
              publisher: book.publisher,
            })}
            query={book.publisher}
            queryType="Publisher"
            currentIsbn={isbn}
          />
        </>
      )}

      <Separator className="my-8" />
      <AISummary
        summary={summary}
        isLoading={isSummaryLoading}
        isError={isSummaryError}
        onRequestSummary={handleRequestSummary}
        isRequested={isRequested}
      />
    </section>
  );
};
