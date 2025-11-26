"use client";

import { PenSquare } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { WishlistButton } from "@/features/user/components/wishlist-button";
// Shadcn/ui 컴포넌트
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import { Separator } from "@/shared/components/shadcn/separator";

import { useBookDetailQuery, useBookSummaryQuery } from "../../queries"; // ⬅️ 실제 hook 경로로 수정하세요.
import { useRecentBookStore } from "../../stores/use-recent-book-store";
import { AISummary } from "./ai-summary";
import { BookDetailError } from "./error";
import { BookDetailSkeleton } from "./skeleton";

export const BookDetail = () => {
  const params = useParams();
  const router = useRouter();
  const isbn = params.isbn as string;

  const {
    data: book,
    isLoading,
    isError,
    isSuccess,
  } = useBookDetailQuery(isbn);
  const addRecentBook = useRecentBookStore((state) => state.addRecentBook);

  useEffect(() => {
    if (isSuccess && book) {
      addRecentBook(book);
    }
  }, [isSuccess, book, addRecentBook]);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  } = useBookSummaryQuery(book?.title || "", book?.author || "", !!book);

  if (isLoading) return <BookDetailSkeleton />;

  if (isError || !book) return <BookDetailError />;

  return (
    <section className="w-full">
      <div className="grid items-start md:grid-cols-3 gap-8 lg:gap-12">
        {/* 왼쪽: 책 이미지 */}
        <div className="w-full md:col-span-1">
          <div className="relative overflow-hidden transition-shadow duration-300 shadow-lg rounded-xl group hover:shadow-2xl">
            <Image
              src={book.image}
              alt={book.title}
              width={600}
              height={800}
              className="object-cover w-full h-auto aspect-3/4 transition-transform duration-300 group-hover:scale-105"
              priority // LCP(Largest Contentful Paint) 최적화를 위해 priority 추가
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20" />
          </div>
        </div>

        {/* 오른쪽: 책 정보 */}
        <div className="flex flex-col h-full md:col-span-2">
          <Badge variant="secondary" className="w-fit">
            국내도서
          </Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tighter text-gray-900 lg:text-4xl">
            {book.title}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {book.author} 저 | {book.publisher}
          </p>

          <div className="mt-6">
            <p className="text-3xl font-extrabold text-gray-900">
              {Number(book.discount).toLocaleString("ko-KR")}원
            </p>
          </div>

          <Separator className="my-6" />

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* 👇 '장바구니' 버튼을 '판매글 작성' 버튼으로 변경 */}
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => router.push(`/book/${isbn}/sell`)}
            >
              <PenSquare className="w-4 h-4 mr-2" />
              중고책 판매글 작성
            </Button>
            <WishlistButton
              type="BOOK"
              id={isbn}
              bookData={book}
              className="w-full sm:w-auto border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 rounded-md"
            />
          </div>

          <Separator className="my-6" />

          {/* Description */}
          <div className="space-y-4 text-base leading-relaxed text-gray-700">
            <h3 className="text-lg font-semibold">작품 소개</h3>
            <p className="whitespace-pre-wrap">{book.description}</p>
          </div>
        </div>
      </div>

      <Separator className="my-8" />
      <AISummary
        summary={summary}
        isLoading={isSummaryLoading}
        isError={isSummaryError}
      />
    </section>
  );
};
