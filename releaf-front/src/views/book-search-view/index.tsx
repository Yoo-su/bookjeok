"use client";

import { BookSearchInput } from "@/features/book/components/book-search/book-search-input";
import { BookSearchResultList } from "@/features/book/components/book-search/book-search-result-list";

export default function BookSearchView() {
  return (
    <div className="w-full min-h-screen py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          도서 검색
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          찾고 싶은 책의 제목, 저자, 출판사를 검색해보세요.
        </p>
      </header>
      <main>
        <BookSearchInput />
        <BookSearchResultList />
      </main>
    </div>
  );
}
