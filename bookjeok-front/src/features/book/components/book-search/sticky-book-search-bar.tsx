"use client";

import debounce from "lodash/debounce";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useBookSearchStore } from "@/features/book/stores/use-book-search-store";
import { Input } from "@/shared/components/shadcn/input";
import { cn } from "@/shared/utils/cn";

interface StickyBookSearchBarProps {
  isVisible: boolean;
}

export const StickyBookSearchBar = ({
  isVisible,
}: StickyBookSearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const query = useBookSearchStore((state) => state.query);
  const setQuery = useBookSearchStore((state) => state.setQuery);
  const [inputValue, setInputValue] = useState(query);

  // 메인 검색어와 동기화
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const debouncedSetQuery = useMemo(
    () =>
      debounce((value: string) => {
        setQuery(value);
      }, 500),
    [setQuery]
  );

  useEffect(() => {
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [debouncedSetQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSetQuery(value);
  };

  const handleClear = () => {
    setInputValue("");
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-4 px-4 transition-all duration-500 ease-in-out transform",
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div className="absolute inset-x-0 top-0 h-full bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100/50" />

      <div className="relative w-full max-w-2xl z-10 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            placeholder="어떤 책을 찾고 계신가요?"
            className="w-full pl-12 pr-10 py-6 text-lg bg-white/50 border-gray-200 focus:bg-white focus:border-blue-500/50 hover:bg-white/80 rounded-full shadow-sm focus:shadow-lg focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
          />
          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
