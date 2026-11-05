"use client";

import {
  SEARCH_PREVIEW_MIN_LENGTH,
  type SearchPreview,
  type SearchPreviewBook,
  type SearchPreviewReview,
  type SearchPreviewSale,
} from "@bookjeok/core";
import {
  usePopularKeywordsQuery,
  useSearchPreviewQuery,
} from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import type React from "react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { useRecentSearchesStore } from "../stores/use-recent-searches-store";

const DEBOUNCE_MS = 200;
const POPULAR_LIMIT = 6;
/** 인기 검색어는 서버 캐시가 6시간이라 그보다 자주 다시 부를 일이 없다 */
const POPULAR_STALE_MS = 60 * 60 * 1000;

export type SearchOption =
  | { kind: "book"; key: string; href: string; book: SearchPreviewBook }
  | { kind: "review"; key: string; href: string; review: SearchPreviewReview }
  | { kind: "sale"; key: string; href: string; sale: SearchPreviewSale }
  | { kind: "more"; key: string; href: string; label: string }
  | { kind: "recent"; key: string; query: string }
  | { kind: "popular"; key: string; query: string; rank: number };

export interface SearchOptionGroup {
  id: "recent" | "popular" | "books" | "reviews" | "sales";
  label: string;
  options: SearchOption[];
}

/**
 * - idle: 입력 전. 최근·인기 검색어
 * - short: 한 글자. 미리보기를 부르지 않음
 * - results / empty / loading / error: 미리보기 결과
 */
export type GlobalSearchStatus =
  | "idle"
  | "short"
  | "loading"
  | "results"
  | "empty"
  | "error";

const buildPreviewGroups = (
  data: SearchPreview,
  query: string,
  t: ReturnType<typeof useTranslations>,
): SearchOptionGroup[] => {
  const groups: SearchOptionGroup[] = [];
  const { books, reviews, sales } = data;

  if (books.items.length > 0) {
    const options: SearchOption[] = books.items.map((book) => ({
      kind: "book",
      key: `book-${book.isbn}`,
      href: PATHS.BOOK_DETAIL(book.isbn),
      book,
    }));
    if (books.total > books.items.length) {
      options.push({
        kind: "more",
        key: "more-books",
        href: PATHS.BOOK_SEARCH_BY_QUERY(query),
        label: t("more_books", { count: books.total.toLocaleString() }),
      });
    }
    groups.push({ id: "books", label: t("section_books"), options });
  }

  if (reviews.items.length > 0) {
    const options: SearchOption[] = reviews.items.map((review) => ({
      kind: "review",
      key: `review-${review.id}`,
      href: PATHS.REVIEW_DETAIL(review.id),
      review,
    }));
    if (reviews.total > reviews.items.length) {
      options.push({
        kind: "more",
        key: "more-reviews",
        href: PATHS.REVIEWS_BY_SEARCH(query),
        label: t("more_reviews", { count: reviews.total.toLocaleString() }),
      });
    }
    groups.push({ id: "reviews", label: t("section_reviews"), options });
  }

  if (sales.items.length > 0) {
    const options: SearchOption[] = sales.items.map((sale) => ({
      kind: "sale",
      key: `sale-${sale.id}`,
      href: PATHS.BOOK_SALES_DETAIL(sale.id),
      sale,
    }));
    if (sales.total > sales.items.length) {
      options.push({
        kind: "more",
        key: "more-sales",
        href: PATHS.BOOK_MARKET_BY_SEARCH(query),
        label: t("more_sales", { count: sales.total.toLocaleString() }),
      });
    }
    groups.push({ id: "sales", label: t("section_sales"), options });
  }

  return groups;
};

interface UseGlobalSearchOptions {
  /** 결과로 이동하거나 Esc를 누르면 부른다 */
  onClose: () => void;
}

/**
 * 상단바 통합 검색의 입력·미리보기·키보드 탐색 상태.
 * 데스크톱 알약 검색창과 모바일 전체 화면 검색이 함께 쓴다.
 */
export function useGlobalSearch({ onClose }: UseGlobalSearchOptions) {
  const t = useTranslations("search.global");
  const router = useRouter();
  const listId = useId();

  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const [query, setQuery] = useState("");
  useEffect(() => {
    // 지울 때는 기다릴 이유가 없어 바로 반영
    const id = window.setTimeout(
      () => setQuery(trimmed),
      trimmed ? DEBOUNCE_MS : 0,
    );
    return () => window.clearTimeout(id);
  }, [trimmed]);

  const preview = useSearchPreviewQuery(query);
  const { data: popularData } = usePopularKeywordsQuery(POPULAR_STALE_MS);
  const recent = useRecentSearchesStore((s) => s.queries);
  const addRecent = useRecentSearchesStore((s) => s.add);
  const removeRecent = useRecentSearchesStore((s) => s.remove);
  const clearRecent = useRecentSearchesStore((s) => s.clear);

  const isPreviewMode = trimmed.length >= SEARCH_PREVIEW_MIN_LENGTH;
  const data = isPreviewMode ? preview.data : undefined;
  const hasItems =
    !!data &&
    data.books.items.length +
      data.reviews.items.length +
      data.sales.items.length >
      0;

  let status: GlobalSearchStatus;
  if (trimmed.length === 0) status = "idle";
  else if (!isPreviewMode) status = "short";
  else if (hasItems) status = "results";
  else if (preview.isError) status = "error";
  // 직전 검색어의 빈 결과를 새 검색어의 빈 결과로 보이지 않게 한다
  else if (!data || preview.isPlaceholderData || query !== trimmed)
    status = "loading";
  else status = "empty";

  /** 결과가 입력보다 늦을 때. 직전 결과를 흐리게 남긴다 */
  const isStale =
    status === "results" &&
    (query !== trimmed || preview.isPlaceholderData || preview.isFetching);

  const groups = useMemo<SearchOptionGroup[]>(() => {
    if (status === "results" && data) {
      return buildPreviewGroups(data, query, t);
    }
    if (status !== "idle") return [];

    const idleGroups: SearchOptionGroup[] = [];
    if (recent.length > 0) {
      idleGroups.push({
        id: "recent",
        label: t("section_recent"),
        options: recent.map((q) => ({
          kind: "recent",
          key: `recent-${q}`,
          query: q,
        })),
      });
    }
    const popular = Array.isArray(popularData) ? popularData : [];
    if (popular.length > 0) {
      idleGroups.push({
        id: "popular",
        label: t("section_popular"),
        options: popular.slice(0, POPULAR_LIMIT).map((item, i) => ({
          kind: "popular",
          key: `popular-${item.keyword}`,
          query: item.keyword,
          rank: i + 1,
        })),
      });
    }
    return idleGroups;
  }, [status, data, query, recent, popularData, t]);

  const options = useMemo(() => groups.flatMap((g) => g.options), [groups]);

  const [activeIndex, setActiveIndex] = useState(-1);
  // 목록이 바뀌면 고른 줄을 풀어 Enter가 엉뚱한 결과로 가지 않게 한다
  useEffect(() => setActiveIndex(-1), [options]);

  const optionId = useCallback(
    (index: number) => `${listId}-option-${index}`,
    [listId],
  );

  const submit = useCallback(
    (raw: string = trimmed) => {
      const q = raw.trim();
      onClose();
      // 빈 Enter는 도서 검색 첫 화면으로. 헤더 메뉴가 검색창으로 바뀌어 다른 길이 없다
      if (!q) {
        router.push(PATHS.BOOK_SEARCH);
        return;
      }
      addRecent(q);
      router.push(PATHS.BOOK_SEARCH_BY_QUERY(q));
    },
    [trimmed, addRecent, onClose, router],
  );

  /** 링크 항목을 눌렀을 때. 이동 자체는 Link가 한다 */
  const handleNavigate = useCallback(() => {
    if (trimmed) addRecent(trimmed);
    onClose();
  }, [trimmed, addRecent, onClose]);

  const choose = useCallback(
    (option: SearchOption) => {
      if (option.kind === "recent" || option.kind === "popular") {
        // 검색어를 넣고 미리보기를 보여 준다. 이동은 Enter로
        setValue(option.query);
        return;
      }
      handleNavigate();
      router.push(option.href);
    },
    [handleNavigate, router],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합 중 Enter·화살표는 조합을 끝내는 키다
    if (e.nativeEvent.isComposing) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (options.length === 0) return;
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      // -1은 입력창. 끝에서 한 번 더 누르면 입력창으로 돌아온다
      setActiveIndex((i) => {
        const next = i + step;
        if (next < -1) return options.length - 1;
        if (next >= options.length) return -1;
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const active = options[activeIndex];
      if (active) choose(active);
      else submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const inputProps = {
    role: "combobox",
    "aria-expanded": true,
    "aria-controls": listId,
    "aria-autocomplete": "list" as const,
    "aria-activedescendant":
      activeIndex >= 0 ? optionId(activeIndex) : undefined,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValue(e.target.value),
    onKeyDown,
    type: "search",
    enterKeyHint: "search" as const,
    autoComplete: "off",
    autoCorrect: "off",
    spellCheck: false,
    placeholder: t("placeholder"),
    "aria-label": t("label"),
  };

  return {
    value,
    setValue,
    /** 미리보기가 받은 검색어. 형광펜은 이 값으로 긋는다 */
    query,
    status,
    isStale,
    groups,
    options,
    activeIndex,
    setActiveIndex,
    listId,
    optionId,
    inputProps,
    submit,
    choose,
    handleNavigate,
    removeRecent,
    clearRecent,
  };
}

export type GlobalSearchController = ReturnType<typeof useGlobalSearch>;
