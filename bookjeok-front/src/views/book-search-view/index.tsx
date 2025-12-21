"use client";

import { useInView } from "react-intersection-observer";

import { BookSearchInput } from "@/features/book/components/book-search/book-search-input";
import { BookSearchResultList } from "@/features/book/components/book-search/book-search-result-list";
import { StickyBookSearchBar } from "@/features/book/components/book-search/sticky-book-search-bar";
import { ScrollTopButton } from "@/shared/components/ui/scroll-top-button";

export default function BookSearchView() {
  const { ref, inView } = useInView({
    initialInView: true,
    threshold: 0,
    rootMargin: "-80px 0px 0px 0px", // 헤더 높이만큼 보정
  });

  return (
    <div className="w-full min-h-screen py-8">
      {/* 스크롤 시 나타나는 Sticky 검색바 */}
      <StickyBookSearchBar isVisible={!inView} />

      <section className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          도서 검색
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          찾고 싶은 책의 제목, 저자, 출판사를 검색해보세요.
        </p>
      </section>

      {/* 메인 검색 영역 감시 */}
      {/* 메인 검색 영역 감시 */}
      <div ref={ref}>
        <BookSearchInput />
      </div>

      <BookSearchResultList />

      {/* 맨 위로 이동 플로팅 버튼 */}
      <ScrollTopButton />
    </div>
  );
}
