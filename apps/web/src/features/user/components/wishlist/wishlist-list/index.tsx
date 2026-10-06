"use client";

import { useMyWishlistQuery } from "@bookjeok/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  AlertTriangle,
  Heart,
  Search,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { FilterTabs } from "@/shared/components/ui/filter-tabs";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { WishlistItem } from "../wishlist-item";
import { WishlistSkeleton } from "./skeleton";

const LIST_ITEM_TRANSITION = {
  type: "spring",
  stiffness: 420,
  damping: 38,
} as const;

type FilterTabKey = "ALL" | "BOOK" | "SALE";

/**
 * 위시리스트 목록을 보여주는 컴포넌트입니다.
 * - 전체 / 도서 / 중고거래 탭 필터 지원
 * - 에러, 로딩, 빈 상태 처리
 */
export const WishlistList = () => {
  const t = useTranslations("wishlist");
  const [activeTab, setActiveTab] = useState<FilterTabKey>("ALL");
  const { data: wishlist, isLoading, isError, refetch } = useMyWishlistQuery();

  const tabs: { key: FilterTabKey; label: string }[] = [
    { key: "ALL", label: t("tabs.all") },
    { key: "BOOK", label: t("tabs.book") },
    { key: "SALE", label: t("tabs.sale") },
  ];

  const counts = useMemo(() => {
    if (!wishlist) {
      return {
        ALL: 0,
        BOOK: 0,
        SALE: 0,
      };
    }
    return {
      ALL: wishlist.length,
      BOOK: wishlist.filter((item) => !!item.book).length,
      SALE: wishlist.filter((item) => !!item.usedBookSale).length,
    };
  }, [wishlist]);

  const filteredWishlist = useMemo(() => {
    if (!wishlist) return [];
    if (activeTab === "ALL") return wishlist;
    if (activeTab === "BOOK") return wishlist.filter((item) => !!item.book);
    if (activeTab === "SALE")
      return wishlist.filter((item) => !!item.usedBookSale);
    return wishlist;
  }, [wishlist, activeTab]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-stone-200 dark:border-stone-800 pb-2 flex gap-1">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className="h-7 w-16 rounded-lg bg-stone-100 dark:bg-stone-800 animate-pulse"
            />
          ))}
        </div>
        <WishlistSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 p-10 text-center space-y-3">
        <AlertTriangle className="h-9 w-9 text-stone-400" />
        <h3 className="font-bold text-stone-900 dark:text-stone-100">
          {t("error_title")}
        </h3>
        <p className="text-xs text-stone-500 max-w-sm">{t("error_desc")}</p>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="mt-2 border-stone-200 dark:border-stone-700"
        >
          {t("retry")}
        </Button>
      </div>
    );
  }

  const isTotalEmpty = !wishlist || wishlist.length === 0;

  return (
    <div className="space-y-6">
      {/* 상태 필터 탭 바 (모바일 가로 스크롤) */}
      <FilterTabs
        tabs={tabs.map((tab) => ({ ...tab, count: counts[tab.key] }))}
        value={activeTab}
        onChange={setActiveTab}
      />

      {/* 탭을 바꿀 때는 새로 그리고, 같은 탭 안에서 찜을 해제했을 때만 빠지는 움직임을 준다.
          빈 안내도 같은 목록 안에 두어야 마지막 찜을 해제하거나 첫 찜이 생길 때도 움직인다 */}
      <div key={activeTab} className="relative flex flex-col gap-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredWishlist.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40 p-12 text-center space-y-3"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400">
                <Heart className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {isTotalEmpty
                    ? t("empty.title")
                    : activeTab === "BOOK"
                      ? t("empty_tab.book_title")
                      : t("empty_tab.sale_title")}
                </h3>
                <p className="text-xs text-stone-400 max-w-sm">
                  {isTotalEmpty
                    ? t("empty.desc")
                    : activeTab === "BOOK"
                      ? t("empty_tab.book_desc")
                      : t("empty_tab.sale_desc")}
                </p>
              </div>
              <Button
                asChild
                size="sm"
                className="mt-2 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 gap-1.5 shadow-2xs rounded-lg cursor-pointer"
              >
                <Link
                  href={
                    activeTab === "SALE" ? PATHS.BOOK_MARKET : PATHS.BOOK_SEARCH
                  }
                >
                  <Search className="h-3.5 w-3.5" />
                  {activeTab === "SALE"
                    ? t("empty.button_sale")
                    : t("empty.button")}
                </Link>
              </Button>
            </motion.div>
          )}
          {filteredWishlist.map((item) => (
            <motion.div
              key={item.id}
              layout="position"
              exit={{ opacity: 0, scale: 0.96 }}
              transition={LIST_ITEM_TRANSITION}
            >
              <WishlistItem item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
