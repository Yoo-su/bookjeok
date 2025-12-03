"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Separator } from "@/shared/components/shadcn/separator";

import { useBookDetailQuery, useBookSummaryQuery } from "../../queries";
import { useRecentBookStore } from "../../stores/use-recent-book-store";
import { AISummary } from "./ai-summary";
import { BookActions } from "./book-actions";
import { BookCover } from "./book-cover";
import { BookDescription } from "./book-description";
import { BookInfo } from "./book-info";
import { BookDetailError } from "./error";
import { BookDetailSkeleton } from "./skeleton";

export const BookDetail = () => {
  const params = useParams();
  const isbn = params.isbn as string;

  const {
    data: book,
    isLoading,
    isError,
    isSuccess,
  } = useBookDetailQuery(isbn);
  const addRecentBook = useRecentBookStore((state) => state.addRecentBook);
  const [isSummaryRequested, setIsSummaryRequested] = useState(false);

  useEffect(() => {
    if (isSuccess && book) {
      addRecentBook(book);
    }
  }, [isSuccess, book, addRecentBook]);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  } = useBookSummaryQuery(
    book?.title || "",
    book?.author || "",
    !!book && isSummaryRequested,
    book?.description
  );

  const handleRequestSummary = () => {
    setIsSummaryRequested(true);
  };

  if (isLoading) return <BookDetailSkeleton />;

  if (isError || !book) return <BookDetailError />;

  return (
    <section className="w-full">
      <div className="grid items-start md:grid-cols-3 gap-8 lg:gap-12">
        <div className="w-full md:col-span-1">
          <BookCover src={book.image} alt={book.title} />
        </div>

        <div className="flex flex-col h-full md:col-span-2">
          <BookInfo
            title={book.title}
            author={book.author}
            publisher={book.publisher}
            price={Number(book.discount)}
          />

          <Separator className="my-6" />

          <BookActions isbn={isbn} book={book} />

          <Separator className="my-6" />

          <BookDescription description={book.description} />
        </div>
      </div>

      <Separator className="my-8" />
      <AISummary
        summary={summary}
        isLoading={isSummaryLoading}
        isError={isSummaryError}
        onRequestSummary={handleRequestSummary}
        isRequested={isSummaryRequested}
      />
    </section>
  );
};
