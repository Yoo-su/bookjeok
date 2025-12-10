
import { create } from 'zustand';
import { createJSONStorage,persist } from 'zustand/middleware';

import { RECENT_BOOKS_KEY } from '../constants';
import { BookInfo } from '../types';

const MAX_RECENT_BOOKS = 10;

interface RecentBookState {
  recentBooks: BookInfo[];
  addRecentBook: (book: BookInfo) => void;
}

export const useRecentBookStore = create<RecentBookState>()(
  persist(
    (set) => ({
      recentBooks: [],
      addRecentBook: (book) =>
        set((state) => {
          const newRecentBooks = [
            book,
            ...state.recentBooks.filter((b) => b.isbn !== book.isbn),
          ].slice(0, MAX_RECENT_BOOKS);

          return { recentBooks: newRecentBooks };
        }),
    }),
    {
      name: RECENT_BOOKS_KEY, // 세션 스토리지에 저장될 키
      storage: createJSONStorage(() => sessionStorage), // 세션 스토리지 사용
    },
  ),
);
