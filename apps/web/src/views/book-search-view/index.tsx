"use client";

import { BookSearchResultList } from "@/features/book/components/book-search/book-search-result-list";
import { ScrollTopButton } from "@/shared/components/ui/scroll-top-button";

// AI 추천 검색은 UI만 숨김(2026-09-29). ?mode=ai도 키워드 검색으로 보여준다.
// 되살릴 때는 search-mode-tabs·ai-chat-window를 다시 연결한다.
export default function BookSearchView() {
  return (
    <div className="w-full min-h-dvh py-8">
      <BookSearchResultList />

      {/* 맨 위로 이동 플로팅 버튼 */}
      <ScrollTopButton />
    </div>
  );
}
