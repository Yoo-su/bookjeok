"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect } from "react";

import {
  ArrowRight,
  History,
  Quote,
  Star,
  X,
} from "@/shared/components/icons/iconsax";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";

import type {
  GlobalSearchController,
  SearchOption,
} from "../hooks/use-global-search";
import { Highlight, splitBookTitle } from "../lib/highlight";

/** 항목을 눌러도 입력창 포커스를 지킨다. 사파리는 blur가 먼저 와서 창이 닫힌다 */
const keepInputFocus = (e: React.MouseEvent) => e.preventDefault();

const SECTION_LABEL_CLASS =
  "font-[family-name:var(--font-nanum-gothic)] text-xs font-bold tracking-[0.04em] text-stone-500";

const ROW_CLASS =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left outline-none transition-colors duration-100 data-[active=true]:bg-stone-100 motion-reduce:transition-none";

const Cover = ({ src }: { src: string | null }) => (
  <span className="relative h-[46px] w-8 shrink-0 overflow-hidden rounded-[3px] border border-stone-200/80 bg-stone-100">
    {src && (
      <Image
        src={src}
        alt=""
        fill
        sizes="32px"
        loading="eager"
        className="object-cover"
      />
    )}
  </span>
);

interface OptionRowProps {
  option: SearchOption;
  index: number;
  search: GlobalSearchController;
}

const OptionContent = ({
  option,
  query,
}: {
  option: SearchOption;
  query: string;
}) => {
  const t = useTranslations("search.global");

  switch (option.kind) {
    case "book": {
      const { book } = option;
      const [main, sub] = splitBookTitle(book.title);
      const counts = [
        book.reviewCount > 0 && t("count_review", { count: book.reviewCount }),
        book.saleCount > 0 && t("count_sale", { count: book.saleCount }),
      ].filter(Boolean);
      return (
        <>
          <Cover src={book.image} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-stone-800">
              <Highlight text={main} query={query} />
              {sub && (
                <span className="ml-1.5 text-xs font-normal text-stone-400">
                  {sub}
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-xs text-stone-500">
              <Highlight text={book.author} query={query} /> · {book.publisher}
            </span>
          </span>
          {counts.length > 0 && (
            <span className="shrink-0 text-[11px] tabular-nums text-stone-500">
              {counts.join(" · ")}
            </span>
          )}
        </>
      );
    }
    case "review": {
      const { review } = option;
      return (
        <>
          <span className="flex w-8 shrink-0 justify-center self-start pt-0.5 text-stone-300">
            <Quote className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-stone-800">
              <Highlight text={review.title} query={query} />
            </span>
            <span className="mt-0.5 block truncate text-xs text-stone-500">
              <Highlight text={review.snippet} query={query} />
            </span>
            <span className="mt-1 flex items-center gap-1 truncate text-[11px] text-stone-400">
              <span className="truncate">
                『{splitBookTitle(review.bookTitle)[0]}』 · {review.nickname}
              </span>
              <Star
                variant="bold"
                className="h-3 w-3 shrink-0 text-stone-400"
                aria-hidden="true"
              />
              <span className="tabular-nums">{review.rating}</span>
            </span>
          </span>
        </>
      );
    }
    case "sale": {
      const { sale } = option;
      return (
        <>
          <Cover src={sale.image} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-stone-800">
              <Highlight text={sale.title} query={query} />
            </span>
            <span className="mt-0.5 block truncate text-xs text-stone-500">
              {[splitBookTitle(sale.bookTitle)[0], sale.region]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-sm font-semibold tabular-nums text-stone-800">
              {t("price", { price: sale.price.toLocaleString() })}
            </span>
            {sale.status === "RESERVED" && (
              <span className="rounded-sm border border-stone-300 px-1 text-[10px] leading-4 text-stone-500">
                {t("sale_reserved")}
              </span>
            )}
          </span>
        </>
      );
    }
    case "more":
      return (
        <span className="flex items-center gap-1 pl-11 text-xs text-stone-500">
          {option.label}
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </span>
      );
    case "recent":
      return (
        <>
          <History
            className="h-4 w-4 shrink-0 text-stone-400"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate pr-8 text-sm text-stone-700">
            {option.query}
          </span>
        </>
      );
    case "popular":
      return (
        <>
          <span className="w-4 shrink-0 font-[family-name:var(--font-gowun-batang)] text-[11px] tabular-nums text-stone-400">
            {String(option.rank).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-stone-700">
            {option.query}
          </span>
        </>
      );
  }
};

const OptionRow = ({ option, index, search }: OptionRowProps) => {
  const t = useTranslations("search.global");
  const active = search.activeIndex === index;
  const common = {
    id: search.optionId(index),
    role: "option",
    "aria-selected": active,
    "data-active": active,
    tabIndex: -1,
    onMouseDown: keepInputFocus,
    // 마우스만 따라간다. 터치 스크롤이 지나간 줄을 고르지 않게
    onPointerMove: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") search.setActiveIndex(index);
    },
    className: cn(ROW_CLASS, option.kind === "more" && "py-1.5"),
  };
  const content = <OptionContent option={option} query={search.query} />;

  if (option.kind === "recent") {
    return (
      <div className="relative">
        <div {...common} onClick={() => search.choose(option)}>
          {content}
        </div>
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={keepInputFocus}
          onClick={() => search.removeRecent(option.query)}
          aria-label={t("remove_recent", { query: option.query })}
          className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-200/60 hover:text-stone-700 pointer-fine:size-7"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    );
  }
  if (option.kind === "popular") {
    return (
      <div {...common} onClick={() => search.choose(option)}>
        {content}
      </div>
    );
  }
  return (
    <Link {...common} href={option.href} onClick={search.handleNavigate}>
      {content}
    </Link>
  );
};

const SkeletonRows = () => (
  <div className="px-3 py-2" aria-hidden="true">
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex items-center gap-3 py-2">
        <div className="h-[46px] w-8 animate-pulse rounded-[3px] bg-stone-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-3/5 animate-pulse rounded bg-stone-100" />
          <div className="h-2.5 w-2/5 animate-pulse rounded bg-stone-100" />
        </div>
      </div>
    ))}
  </div>
);

interface SearchPreviewPanelProps {
  search: GlobalSearchController;
  /** popover: 데스크톱 알약 아래. sheet: 모바일 전체 화면 */
  variant: "popover" | "sheet";
  className?: string;
}

/** 통합 검색의 미리보기 목록. 입력 전에는 최근·인기 검색어를 보여 준다 */
export const SearchPreviewPanel = ({
  search,
  variant,
  className,
}: SearchPreviewPanelProps) => {
  const t = useTranslations("search.global");
  const { status, groups, activeIndex, optionId, value } = search;

  // 키보드로 고른 줄이 목록 밖으로 나가지 않게
  useEffect(() => {
    if (activeIndex < 0) return;
    document
      .getElementById(optionId(activeIndex))
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, optionId]);

  let index = 0;
  const message = (text: string, withLink: boolean) => (
    <div className="px-6 py-8 text-center">
      <p className="text-sm text-stone-500">{text}</p>
      {withLink && (
        <Link
          href={PATHS.BOOK_SEARCH_BY_QUERY(value.trim())}
          onClick={search.handleNavigate}
          className="mt-3 inline-flex items-center gap-1 py-1.5 text-xs font-medium text-stone-700 underline-offset-4 hover:underline"
        >
          {t("search_books")}
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-col",
        variant === "popover" &&
          "max-h-[min(560px,calc(100dvh-7rem))] overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          variant === "popover"
            ? "p-1.5"
            : "px-2 pb-[calc(1rem+env(safe-area-inset-bottom))]",
        )}
      >
        <div
          id={search.listId}
          role="listbox"
          aria-label={t("results")}
          className={cn(
            "transition-opacity duration-150 motion-reduce:transition-none",
            search.isStale && "opacity-60",
          )}
        >
          {groups.map((group) => (
            <div
              key={group.id}
              role="group"
              aria-labelledby={`${search.listId}-${group.id}`}
              className="pb-1"
            >
              <div className="flex items-center justify-between px-3 pb-1.5 pt-3">
                <span
                  id={`${search.listId}-${group.id}`}
                  className={SECTION_LABEL_CLASS}
                >
                  {group.label}
                </span>
                {group.id === "recent" && (
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={keepInputFocus}
                    onClick={search.clearRecent}
                    className="-my-2 py-2 text-[11px] text-stone-400 transition-colors hover:text-stone-700"
                  >
                    {t("clear_recent")}
                  </button>
                )}
              </div>
              {group.options.map((option) => (
                <OptionRow
                  key={option.key}
                  option={option}
                  index={index++}
                  search={search}
                />
              ))}
            </div>
          ))}
        </div>

        {status === "idle" && groups.length === 0 && message(t("intro"), false)}
        {status === "short" && message(t("short"), false)}
        {status === "loading" && <SkeletonRows />}
        {status === "empty" &&
          message(t("empty", { query: value.trim() }), true)}
        {status === "error" && message(t("error"), true)}

        {status === "idle" && (
          <Link
            href={PATHS.BOOK_SEARCH}
            onClick={search.handleNavigate}
            className="mx-3 mb-1 mt-2 flex items-center justify-between border-t border-stone-100 py-3 text-xs text-stone-500 transition-colors hover:text-stone-900"
          >
            {t("go_book_search")}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        )}
      </div>

      {variant === "popover" && status !== "idle" && (
        <div className="hidden items-center gap-3 border-t border-stone-100 px-4 py-2 text-[11px] text-stone-400 pointer-fine:flex">
          <span>
            <kbd className="font-sans">↵</kbd> {t("hint_enter")}
          </span>
          <span>
            <kbd className="font-sans">↑↓</kbd> {t("hint_move")}
          </span>
          <span>
            <kbd className="font-sans">esc</kbd> {t("hint_close")}
          </span>
        </div>
      )}
    </div>
  );
};
