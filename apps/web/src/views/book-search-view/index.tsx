"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInView } from "react-intersection-observer";

import { AiChatWindow } from "@/features/book/components/book-search/ai-chat-window";
import { BookSearchInput } from "@/features/book/components/book-search/book-search-input";
import { BookSearchResultList } from "@/features/book/components/book-search/book-search-result-list";
import { PopularKeywords } from "@/features/book/components/book-search/popular-keywords";
import {
  SearchMode,
  SearchModeTabs,
} from "@/features/book/components/book-search/search-mode-tabs";
import { StickyBookSearchBar } from "@/features/book/components/book-search/sticky-book-search-bar";
import { ScrollTopButton } from "@/shared/components/ui/scroll-top-button";

export default function BookSearchView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL 쿼리파라미터(?mode=ai)를 우선 참조하여 뒤로가기/페이지 이동 시에도 활성화 탭 보존
  const modeParam = searchParams.get("mode");
  const searchMode: SearchMode = modeParam === "ai" ? "AI" : "KEYWORD";

  const handleModeChange = (newMode: SearchMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newMode === "AI") {
      params.set("mode", "ai");
    } else {
      params.delete("mode");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

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
      {/* 스크롤 시 나타나는 Sticky 검색바 (키워드 검색 모드 전용) */}
      {searchMode === "KEYWORD" && (
        <StickyBookSearchBar isVisible={isStickyVisible} />
      )}

      {/* 탭 메뉴: [ 키워드 검색 | AI 추천 검색 ] */}
      <SearchModeTabs activeMode={searchMode} onModeChange={handleModeChange} />

      {/* 모드별 뷰 스위칭 */}
      {searchMode === "KEYWORD" ? (
        <>
          <div ref={ref}>
            <BookSearchInput />
          </div>

          <div className="flex justify-center mb-8">
            <PopularKeywords />
          </div>

          <BookSearchResultList />
        </>
      ) : (
        <AiChatWindow />
      )}

      {/* 맨 위로 이동 플로팅 버튼 (키워드 검색 모드 전용) */}
      {searchMode === "KEYWORD" && <ScrollTopButton />}
    </div>
  );
}
