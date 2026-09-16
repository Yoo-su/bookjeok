"use client";

import { SaleStatus, WishlistItem as WishlistItemType } from "@bookjeok/core";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { SaleStatusBadge } from "@/features/book-sale/components/common/sale-status-badge";
import { TradeMethodBadge } from "@/features/book-sale/components/common/trade-method-badge";
import { BookIcon, ShoppingBagIcon } from "@/shared/components/icons";
import { ChevronRight } from "@/shared/components/icons/iconsax";
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import { Card, CardContent } from "@/shared/components/shadcn/card";
import { PriceDisplay } from "@/shared/components/ui/price-display";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { formatDate } from "@/shared/utils/format-date";

import { WishlistButton } from "../wishlist-button";

interface WishlistItemProps {
  item: WishlistItemType;
}

export const WishlistItem = ({ item }: WishlistItemProps) => {
  const t = useTranslations("wishlist.item");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  // 1. 책 찜하기인 경우
  if (item.book) {
    const book = item.book;
    return (
      <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs hover:shadow-xs transition-all duration-200 bg-white dark:bg-stone-900/80 overflow-hidden">
        <CardContent className="p-4 sm:p-5 space-y-3">
          {/* 상단 메타: 등록일시, 배지, 찜 버튼 */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 dark:border-stone-800 text-xs">
            <div className="flex items-center gap-1.5 text-stone-400">
              <span>{formatDate(item.createdAt, locale, "date")}</span>
              <span>·</span>
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1.5 h-5 font-medium border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
              >
                {t("type_book")}
              </Badge>
            </div>
            <WishlistButton
              type="BOOK"
              id={book.isbn}
              className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              initialIsWishlisted={true}
            />
          </div>

          {/* 메인: 도서 썸네일 & 도서 정보 */}
          <div className="flex gap-3.5 items-start">
            {/* 도서 표지 */}
            <Link
              href={PATHS.BOOK_DETAIL(book.isbn)}
              className="relative h-24 w-18 sm:h-28 sm:w-20 shrink-0 overflow-hidden rounded-md border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 group shadow-2xs"
            >
              {book.image ? (
                <Image
                  src={book.image}
                  alt={book.title}
                  fill
                  sizes="80px"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-stone-400">
                  <BookIcon className="h-6 w-6" />
                </div>
              )}
            </Link>

            {/* 도서 텍스트 */}
            <div className="flex-1 min-w-0 space-y-1">
              <Link
                href={PATHS.BOOK_DETAIL(book.isbn)}
                className="block font-serif font-bold text-stone-900 dark:text-stone-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-base line-clamp-1"
              >
                {book.title}
              </Link>

              <p className="text-xs text-stone-500 line-clamp-1">
                {book.author}
                {book.publisher && ` · ${book.publisher}`}
                {book.pubdate &&
                  ` (${formatDate(book.pubdate, locale, "yearMonth")})`}
              </p>

              {book.description && (
                <p className="text-xs text-stone-400 dark:text-stone-500 line-clamp-2 pt-0.5 leading-relaxed">
                  {book.description}
                </p>
              )}
            </div>
          </div>

          {/* 하단 바: 가격 or ISBN + 상세 버튼 */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              {book.discount &&
              !isNaN(Number(book.discount)) &&
              Number(book.discount) > 0 ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-stone-400">
                    {t("discount_price")}
                  </span>
                  <PriceDisplay
                    value={Number(book.discount)}
                    className="text-sm font-bold text-stone-900 dark:text-stone-100"
                  />
                </div>
              ) : (
                <span className="font-mono text-xs text-stone-400">
                  ISBN: {book.isbn}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
              >
                <Link href={PATHS.BOOK_DETAIL(book.isbn)}>
                  {t("view_detail")}
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 2. 중고 판매글 찜하기인 경우
  if (item.usedBookSale) {
    const sale = item.usedBookSale;
    const isSoldOut = sale.status === SaleStatus.SOLD;
    const saleImage = sale.imageUrls?.[0] || sale.book?.image;

    return (
      <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs hover:shadow-xs transition-all duration-200 bg-white dark:bg-stone-900/80 overflow-hidden">
        <CardContent className="p-4 sm:p-5 space-y-3">
          {/* 상단 메타: 등록일시, 배지들, 찜 버튼 */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 dark:border-stone-800 text-xs">
            <div className="flex items-center gap-1.5 text-stone-400 flex-wrap">
              <span>{formatDate(item.createdAt, locale, "date")}</span>
              <span>·</span>
              <Badge
                variant="secondary"
                className="text-[10px] py-0 px-1.5 h-5 font-medium"
              >
                {t("type_sale")}
              </Badge>
              <TradeMethodBadge
                tradeMethod={sale.tradeMethod}
                className="text-[10px] py-0 px-1.5 h-5 font-medium"
              />
              <SaleStatusBadge
                status={sale.status}
                className="h-5 px-1.5 text-[10px] font-medium"
              />
            </div>
            <WishlistButton
              type="SALE"
              id={String(sale.id)}
              className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              initialIsWishlisted={true}
            />
          </div>

          {/* 메인: 판매글 썸네일 & 정보 */}
          <div className="flex gap-3.5 items-start">
            {/* 썸네일 */}
            <Link
              href={PATHS.BOOK_SALES_DETAIL(String(sale.id))}
              className="relative h-24 w-18 sm:h-28 sm:w-20 shrink-0 overflow-hidden rounded-md border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 group shadow-2xs"
            >
              {saleImage ? (
                <Image
                  src={saleImage}
                  alt={sale.title}
                  fill
                  sizes="80px"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-stone-400">
                  <ShoppingBagIcon className="h-6 w-6" />
                </div>
              )}
              {isSoldOut && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-2xs">
                  <span className="text-[11px] font-bold text-white tracking-tight">
                    {t("sold_out")}
                  </span>
                </div>
              )}
            </Link>

            {/* 판매글 텍스트 */}
            <div className="flex-1 min-w-0 space-y-1">
              <Link
                href={PATHS.BOOK_SALES_DETAIL(String(sale.id))}
                className="block font-serif font-bold text-stone-900 dark:text-stone-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-base line-clamp-1"
              >
                {sale.title}
              </Link>

              {sale.book && (
                <p className="text-xs text-stone-500 line-clamp-1">
                  {sale.book.title}
                  {sale.book.author && ` · ${sale.book.author}`}
                </p>
              )}

              {sale.content && (
                <p className="text-xs text-stone-400 dark:text-stone-500 line-clamp-2 pt-0.5 leading-relaxed">
                  {sale.content}
                </p>
              )}
            </div>
          </div>

          {/* 하단 바: 판매 금액 + 상세 버튼 */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-stone-400">{t("price")}</span>
              <PriceDisplay
                value={sale.price}
                className="text-base font-bold text-stone-900 dark:text-stone-100 tabular-nums"
                unitClassName="text-xs font-normal text-stone-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                asChild
                variant="ghost"
                size="sm"
                disabled={isSoldOut}
                className="h-8 text-xs px-2.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-50"
              >
                <Link href={PATHS.BOOK_SALES_DETAIL(String(sale.id))}>
                  {isSoldOut ? t("sale_ended") : t("view_detail")}
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
