"use client";

import { useBookDetailQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";

import { BookOpen } from "@/shared/components/icons/iconsax";

interface BookFilterChipProps {
  isbn: string;
  onClear: () => void;
}

/**
 * 도서로 걸러진 상태를 알리는 칩.
 *
 * ISBN 13자리를 그대로 보여주면 무엇으로 걸러졌는지 알 수 없어 제목을 조회한다.
 * 도서 상세에서 넘어온 경로가 대부분인데 그때는 같은 쿼리 키가 이미 캐시에
 * 있어 추가 요청이 없다. 제목이 오기 전에는 ISBN을 그대로 보여준다.
 */
export function BookFilterChip({ isbn, onClear }: BookFilterChipProps) {
  const tAria = useTranslations("common.aria");
  const { data: book } = useBookDetailQuery(isbn);
  const label = book?.title || isbn;

  return (
    <button
      onClick={onClear}
      aria-label={tAria("book_filter_clear", { book: label })}
      className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-3 py-1 text-xs font-light text-stone-600 hover:border-stone-500 hover:text-stone-900 transition-colors duration-200 cursor-pointer"
    >
      <BookOpen className="h-3.5 w-3.5 text-stone-400" />
      <span className="max-w-[240px] truncate">{label}</span>
      <span aria-hidden="true" className="text-stone-400">
        ✕
      </span>
    </button>
  );
}
