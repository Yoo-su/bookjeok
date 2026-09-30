import { create } from "zustand";

interface BookSearchUiState {
  /** 히어로 검색창이 헤더 뒤로 스크롤돼 가려졌는지 */
  isHeroSearchHidden: boolean;
  setHeroSearchHidden: (hidden: boolean) => void;
}

/**
 * 검색 페이지 UI 상태
 * - 히어로 폼과 결과 뷰가 서로 다른 Suspense 경계에 있어 스토어로 공유합니다.
 */
export const useBookSearchUiStore = create<BookSearchUiState>()((set) => ({
  isHeroSearchHidden: false,
  setHeroSearchHidden: (hidden) => set({ isHeroSearchHidden: hidden }),
}));
