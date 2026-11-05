import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_RECENT_SEARCHES = 8;

interface RecentSearchesState {
  queries: string[];
  add: (query: string) => void;
  remove: (query: string) => void;
  clear: () => void;
}

/** 상단바 통합 검색의 최근 검색어. 기기에만 남긴다(localStorage) */
export const useRecentSearchesStore = create<RecentSearchesState>()(
  persist(
    (set) => ({
      queries: [],
      add: (query) =>
        set((state) => ({
          queries: [query, ...state.queries.filter((q) => q !== query)].slice(
            0,
            MAX_RECENT_SEARCHES,
          ),
        })),
      remove: (query) =>
        set((state) => ({ queries: state.queries.filter((q) => q !== query) })),
      clear: () => set({ queries: [] }),
    }),
    { name: "recent-searches" },
  ),
);
