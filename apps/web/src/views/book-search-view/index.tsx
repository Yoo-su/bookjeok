"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { BookSearchResultList } from "@/features/book/components/book-search/book-search-result-list";
import {
  FloatingBookSearchBar,
  type FloatingBookSearchMode,
} from "@/features/book/components/book-search/floating-book-search-bar";
import { useBookSearchUiStore } from "@/features/book/stores/use-book-search-ui-store";
import { useMusicStore } from "@/features/music";

// AI 추천 검색은 UI만 숨김(2026-09-29). ?mode=ai도 키워드 검색으로 보여준다.
// 되살릴 때는 search-mode-tabs·ai-chat-window를 다시 연결한다.
export default function BookSearchView() {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const isHeroSearchHidden = useBookSearchUiStore(
    (state) => state.isHeroSearchHidden,
  );
  // 하단 여백 안쪽까지 들어와야 끝으로 판정해 "모두 불러왔어요" 문구를 가리지 않음
  const { ref: endRef, entry: endEntry } = useInView({
    rootMargin: "0px 0px -80px 0px",
  });
  // 푸터가 길어 맨 끝에서는 표시 요소가 화면 위로 지나가므로 지나간 경우도 끝으로 봄
  const isEnd =
    !!endEntry &&
    (endEntry.isIntersecting || endEntry.boundingClientRect.top < 0);

  // 채팅 버튼·음악 알약은 레이아웃 전역 요소라 상태만 읽어 피해 감
  const user = useAuthStore((state) => state.user);
  const isMusicPlaying = useMusicStore(
    (state) => state.isPlaying && !state.isModalOpen,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const mode: FloatingBookSearchMode = !isHeroSearchHidden
    ? "hidden"
    : isEnd
      ? "top"
      : "search";

  const scrollToResults = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    resultsRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <div
      ref={resultsRef}
      className="flex w-full min-h-dvh scroll-mt-24 flex-col py-8"
    >
      <BookSearchResultList />
      {/* 결과가 짧아도 뷰 바닥(푸터 직전)에 두어 끝 판정이 이르지 않게 함 */}
      <div ref={endRef} aria-hidden="true" className="mt-auto" />

      <FloatingBookSearchBar
        mode={mode}
        hasChatButton={mounted && !!user}
        hasMusicPill={mounted && isMusicPlaying}
        onSearch={scrollToResults}
      />
    </div>
  );
}
