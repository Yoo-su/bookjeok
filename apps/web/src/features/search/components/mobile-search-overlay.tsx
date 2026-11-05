"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";

import { ArrowLeft, Search, X } from "@/shared/components/icons/iconsax";
import { useBodyScrollLock } from "@/shared/hooks/use-body-scroll-lock";

import { useGlobalSearch } from "../hooks/use-global-search";
import { GLOBAL_SEARCH_INPUT_ATTR, SEARCH_INPUT_CLASS } from "./header-search";
import { SearchPreviewPanel } from "./search-preview-panel";

const keepInputFocus = (e: React.MouseEvent) => e.preventDefault();

const ICON_BUTTON_CLASS =
  "flex size-10 shrink-0 items-center justify-center rounded-full text-stone-600 transition-[background-color,color,scale] duration-150 active:scale-90 active:bg-stone-100 motion-reduce:transition-none";

/**
 * 모바일 전체 화면 검색. 헤더 아이콘을 누르면 화면을 덮는다.
 * 여는 쪽이 flushSync로 그린 뒤 같은 탭 이벤트 안에서 입력창에 포커스해야 iOS 키보드가 열린다.
 */
export const MobileSearchOverlay = ({ onClose }: { onClose: () => void }) => {
  const t = useTranslations("search.global");
  const search = useGlobalSearch({ onClose });
  useBodyScrollLock(true);

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={t("label")}
      initial={{ opacity: 0, transform: "translateY(-8px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      exit={{
        opacity: 0,
        transform: "translateY(-6px)",
        transition: { duration: 0.14 },
      }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[60] flex h-dvh flex-col bg-white"
    >
      <div
        role="search"
        className="flex items-center gap-1 border-b border-stone-100 px-2 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className={ICON_BUTTON_CLASS}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-stone-100 pl-4 pr-1">
          <Search
            className="h-4 w-4 shrink-0 text-stone-400"
            aria-hidden="true"
          />
          <input
            {...search.inputProps}
            {...{ [GLOBAL_SEARCH_INPUT_ATTR]: "" }}
            className={SEARCH_INPUT_CLASS}
          />
          {search.value && (
            <button
              type="button"
              onMouseDown={keepInputFocus}
              onClick={() => search.setValue("")}
              aria-label={t("clear")}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-stone-400 active:bg-stone-200"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <SearchPreviewPanel
        search={search}
        variant="sheet"
        className="min-h-0 flex-1"
      />
    </motion.div>,
    document.body,
  );
};
