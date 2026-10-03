"use client";

import { BookSearchResultList } from "@/features/book/components/book-search/book-search-result-list";
import { BOOK_SEARCH_RESULTS_ATTR } from "@/features/book/components/book-search/dock-book-search-field";

// AI 추천 검색은 UI만 숨김(2026-09-29). ?mode=ai도 키워드 검색으로 보여준다.
// 되살릴 때는 search-mode-tabs·ai-chat-window를 다시 연결한다.
// 히어로가 가려진 뒤의 검색 입력은 하단 dock이 맡는다(layouts/common/bottom-dock).
export default function BookSearchView() {
  return (
    <div
      {...{ [BOOK_SEARCH_RESULTS_ATTR]: "" }}
      className="flex w-full min-h-dvh scroll-mt-24 flex-col py-8"
    >
      <BookSearchResultList />
    </div>
  );
}
