"use client";

import { UsedBookSale } from "@bookjeok/core";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";
import { formatRelativeTime } from "@/shared/utils/format-date";

/** 한 번에 보여줄 판매글 수 (모바일에서는 마지막 한 줄을 숨겨 3줄만 노출) */
const VISIBLE_COUNT = 4;
/** 목록을 한 칸씩 밀어 올리는 주기 */
const ROTATE_INTERVAL = 4000;

interface LiveListingFeedProps {
  sales: UsedBookSale[];
  isLoading: boolean;
  /** 동작 줄이기 설정이 켜져 있으면 자동 회전을 멈춥니다. */
  paused?: boolean;
  className?: string;
}

export const LiveListingFeed = ({
  sales,
  isLoading,
  paused = false,
  className,
}: LiveListingFeedProps) => {
  const t = useTranslations("market.hero.feed");
  const locale = useLocale();
  const [offset, setOffset] = useState(0);

  // 보여줄 개수보다 많이 있을 때만 회전시킨다. (적으면 같은 항목이 중복 렌더링됨)
  const canRotate = !paused && sales.length > VISIBLE_COUNT;

  useEffect(() => {
    if (!canRotate) return;
    const timer = setInterval(
      () => setOffset((prev) => prev + 1),
      ROTATE_INTERVAL,
    );
    return () => clearInterval(timer);
  }, [canRotate]);

  const visibleSales = useMemo(() => {
    if (sales.length === 0) return [];
    const size = Math.min(VISIBLE_COUNT, sales.length);
    return Array.from(
      { length: size },
      (_, i) => sales[(offset + i) % sales.length],
    );
  }, [sales, offset]);

  return (
    <div className={cn("border border-white/10 bg-white/[0.02]", className)}>
      <div className="border-b border-white/10 px-4 py-3">
        <span className="text-[10px] tracking-[0.24em] text-neutral-500">
          {t("title")}
        </span>
      </div>

      {isLoading && <FeedSkeleton />}

      {!isLoading && visibleSales.length === 0 && (
        <p className="px-4 py-10 text-center text-[13px] text-neutral-500">
          {t("empty")}
        </p>
      )}

      {!isLoading && visibleSales.length > 0 && (
        <ul className="divide-y divide-white/[0.06]">
          <AnimatePresence initial={false} mode="popLayout">
            {visibleSales.map((sale, index) => (
              <motion.li
                key={sale.id}
                layout
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 14 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className={cn(index === 3 && "hidden md:block")}
              >
                <Link
                  href={PATHS.BOOK_SALES_DETAIL(sale.id)}
                  prefetch={false}
                  className="pointer-events-auto group flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-white/[0.05]"
                >
                  <div className="relative h-[46px] w-[34px] shrink-0 overflow-hidden bg-white/10">
                    <Image
                      src={
                        sale.imageUrls[0] ||
                        sale.book?.image ||
                        "/images/placeholder-image.svg"
                      }
                      alt=""
                      fill
                      sizes="34px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] leading-snug text-neutral-200 transition-colors group-hover:text-white">
                      {sale.title}
                    </p>
                    <p className="mt-1.5 truncate text-[11px] text-neutral-500">
                      {[
                        sale.district || sale.city,
                        formatRelativeTime(sale.createdAt, locale),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <span className="shrink-0 text-[13px] font-medium tabular-nums text-neutral-100">
                    {t("price", { price: sale.price.toLocaleString(locale) })}
                  </span>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
};

const FeedSkeleton = () => (
  <ul className="divide-y divide-white/[0.06]">
    {Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
      <li
        key={i}
        className={cn(
          "flex items-center gap-3.5 px-4 py-3",
          i === 3 && "hidden md:flex",
        )}
      >
        <div className="h-[46px] w-[34px] shrink-0 animate-pulse bg-white/10" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-3/4 animate-pulse bg-white/10" />
          <div className="h-2.5 w-1/3 animate-pulse bg-white/[0.07]" />
        </div>
        <div className="h-3 w-12 shrink-0 animate-pulse bg-white/10" />
      </li>
    ))}
  </ul>
);
