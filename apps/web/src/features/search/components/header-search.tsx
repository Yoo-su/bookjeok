"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { Search, X } from "@/shared/components/icons/iconsax";
import { cn } from "@/shared/utils/cn";

import { useGlobalSearch } from "../hooks/use-global-search";
import { SearchPreviewPanel } from "./search-preview-panel";

/** 열 때 탭 이벤트 안에서 바로 포커스를 주기 위한 표식. iOS는 그래야 키보드가 열린다 */
export const GLOBAL_SEARCH_INPUT_ATTR = "data-global-search-input";

export const focusGlobalSearchInput = () =>
  document
    .querySelector<HTMLInputElement>(`[${GLOBAL_SEARCH_INPUT_ATTR}]`)
    ?.focus();

/** 사파리는 버튼을 눌러도 포커스를 옮기지 않아 blur가 먼저 닫아 버린다 */
const keepInputFocus = (e: React.MouseEvent) => e.preventDefault();

const EASE = [0.22, 1, 0.36, 1] as const;

export const SEARCH_INPUT_CLASS =
  "min-w-0 flex-1 bg-transparent text-base text-stone-900 outline-none placeholder:font-[family-name:var(--font-gowun-batang)] placeholder:text-stone-400 md:text-sm [&::-webkit-search-cancel-button]:appearance-none";

/** 연필로 그은 듯 살짝 흔들리는 밑줄. 열릴 때 왼쪽부터 그어진다 */
const PencilLine = () => (
  <svg
    className="pointer-events-none absolute inset-x-0 -bottom-1 h-2 w-full text-stone-900"
    // non-scaling-stroke에서는 대시 길이가 viewBox 단위로 잡힌다. 실제 폭(480~544px)보다
    // 좁은 viewBox를 늘리면 pathLength=1이 선 일부만 덮어 오른쪽만 그어진다
    viewBox="0 0 600 8"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <motion.path
      d="M 2 5 C 90 3.5 165 6 270 4.6 S 450 3.4 598 4.4"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      fill="none"
      vectorEffect="non-scaling-stroke"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.65 }}
      transition={{
        pathLength: { duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.08 },
        opacity: { duration: 0.1, delay: 0.08 },
      }}
    />
  </svg>
);

interface HeaderSearchProps {
  /** Esc·결과 이동. 여는 버튼으로 포커스를 돌려준다 */
  onClose: () => void;
  /** 바깥을 눌렀을 때. 누른 곳의 포커스를 빼앗지 않는다 */
  onDismiss: () => void;
}

/**
 * 데스크톱 헤더 알약 안에서 메뉴 자리를 대신하는 검색창.
 * 알약에 겹쳐 두므로 부모(알약)가 `relative`여야 한다.
 */
export const HeaderSearch = ({ onClose, onDismiss }: HeaderSearchProps) => {
  const t = useTranslations("search.global");
  const rootRef = useRef<HTMLDivElement>(null);
  const search = useGlobalSearch({ onClose });

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onDismiss();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onDismiss]);

  return (
    <div
      ref={rootRef}
      role="search"
      aria-label={t("label")}
      className="pointer-events-none absolute inset-0"
    >
      {/* 메뉴가 있던 정중앙에서 양옆으로 펼쳐진다 */}
      <motion.div
        initial={{ opacity: 0, clipPath: "inset(0% 42% 0% 42%)" }}
        animate={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
        exit={{
          opacity: 0,
          clipPath: "inset(0% 42% 0% 42%)",
          transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
        }}
        transition={{ duration: 0.38, ease: EASE }}
        className="pointer-events-auto absolute left-1/2 top-1/2 w-[30rem] -translate-x-1/2 -translate-y-1/2 xl:w-[34rem]"
      >
        <div className="relative flex h-10 items-center gap-2.5 px-1">
          <Search
            className="h-4 w-4 shrink-0 text-stone-400"
            aria-hidden="true"
          />
          <input
            {...search.inputProps}
            {...{ [GLOBAL_SEARCH_INPUT_ATTR]: "" }}
            className={SEARCH_INPUT_CLASS}
          />
          {search.value ? (
            <button
              type="button"
              onMouseDown={keepInputFocus}
              onClick={() => search.setValue("")}
              aria-label={t("clear")}
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-800"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : (
            <kbd className="hidden shrink-0 rounded border border-stone-200 px-1.5 font-sans text-[10px] leading-4 text-stone-400 pointer-fine:inline">
              esc
            </kbd>
          )}
          <PencilLine />
        </div>
      </motion.div>

      <div className="pointer-events-auto absolute left-1/2 top-[calc(100%+0.75rem)] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, transform: "translateY(-6px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          exit={{
            opacity: 0,
            transform: "translateY(-4px)",
            transition: { duration: 0.12 },
          }}
          transition={{ duration: 0.24, ease: EASE, delay: 0.06 }}
          className={cn(
            "overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-lg shadow-stone-900/5",
          )}
        >
          <SearchPreviewPanel search={search} variant="popover" />
        </motion.div>
      </div>
    </div>
  );
};
