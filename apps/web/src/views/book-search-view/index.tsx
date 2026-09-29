"use client";

import { useInView } from "react-intersection-observer";

import { BookSearchInput } from "@/features/book/components/book-search/book-search-input";
import { BookSearchResultList } from "@/features/book/components/book-search/book-search-result-list";
import { PopularKeywords } from "@/features/book/components/book-search/popular-keywords";
import { StickyBookSearchBar } from "@/features/book/components/book-search/sticky-book-search-bar";
import { ScrollTopButton } from "@/shared/components/ui/scroll-top-button";

// AI 추천 검색은 UI만 숨김(2026-09-29). ?mode=ai도 키워드 검색으로 보여준다.
// 되살릴 때는 search-mode-tabs·ai-chat-window를 다시 연결한다.
export default function BookSearchView() {
  const { ref, inView, entry } = useInView({
    initialInView: true,
    threshold: 0,
    rootMargin: "-80px 0px 0px 0px", // 헤더 높이만큼 보정
  });

  // 오리지널 검색창이 헤더(80px) 위로 완전히 사라졌을 때만 sticky 검색바를 노출
  const isStickyVisible =
    !inView && !!entry && entry.boundingClientRect.top < 80;

  return (
    <div className="w-full min-h-dvh py-4">
      {/* 스크롤 시 나타나는 Sticky 검색바 */}
      <StickyBookSearchBar isVisible={isStickyVisible} />

      <div ref={ref}>
        <BookSearchInput />
      </div>

      <div className="flex justify-center mb-8">
        <PopularKeywords />
      </div>

      <BookSearchResultList />

      {/* 맨 위로 이동 플로팅 버튼 */}
      <ScrollTopButton />
    </div>
  );
}
