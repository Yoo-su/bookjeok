import { create } from "zustand";

interface BookSearchState {
  query: string;
  setQuery: (query: string) => void;
}
export const useBookSearchStore = create<BookSearchState>((set) => ({
  query: "",
  setQuery: (query) => set({ query }),
}));
