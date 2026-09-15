"use client";

import { UsedBookSale } from "@bookjeok/core";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

import { useConfirm } from "@/features/confirm";
import { BookIcon } from "@/shared/components/icons";
import {
  ChevronRight,
  Edit,
  MoreVertical,
  Trash2,
} from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { Card, CardContent } from "@/shared/components/shadcn/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/shadcn/dropdown-menu";
import { PriceDisplay } from "@/shared/components/ui/price-display";
import { Link, useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { formatDate } from "@/shared/utils/format-date";

import { useDeleteBookSaleMutation } from "../../../mutations";
import { SaleStatusBadge } from "../../common/sale-status-badge";
import { SaleStatusSelect } from "../../common/sale-status-select";
import { TradeMethodBadge } from "../../common/trade-method-badge";

interface BookSaleHistoryItemProps {
  sale: UsedBookSale;
}

export const BookSaleHistoryItem = ({ sale }: BookSaleHistoryItemProps) => {
  const t = useTranslations("market.history");
  const tActions = useTranslations("market.detail.actions");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const locale = useLocale();

  const { mutate: deleteSale, isPending: isDeleting } =
    useDeleteBookSaleMutation();

  const confirm = useConfirm();

  // 잠금 근거는 상태가 아니라 활성 주문이다. 판매자가 직접 예약중으로 바꾼
  // 직거래 건은 잠그면 안 된다 (판매완료로 넘어갈 길이 막힌다).
  // 거래 기록이 남은 글은 삭제 시 후기까지 사라지므로 함께 잠근다.
  const isLockedByOrder =
    sale.hasActiveOrder === true || sale.hasTradeCompletion === true;

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const isConfirmed = await confirm({
      title: tActions("delete"),
      description: tActions("delete_desc"),
      confirmText: tActions("delete"),
      variant: "destructive",
    });

    if (isConfirmed) {
      deleteSale({ saleId: sale.id, imageUrls: sale.imageUrls });
    }
  };

  const handleDropdownClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const bookCover = (sale.imageUrls && sale.imageUrls[0]) || sale.book?.image;

  return (
    <Card className="rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs hover:shadow-xs transition-all duration-200 bg-white dark:bg-stone-900/80 overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* 상단 메타: 등록일시, 배지들 */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 dark:border-stone-800 text-xs">
          <div className="flex items-center gap-1.5 text-stone-400">
            <span>{formatDate(sale.createdAt, locale, "date")}</span>
            <span>·</span>
            <span className="font-mono">#{sale.id}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TradeMethodBadge
              tradeMethod={sale.tradeMethod}
              className="text-[10px] py-0 px-1.5 h-5 font-medium"
            />
            <SaleStatusBadge
              status={sale.status}
              className="h-5 px-1.5 text-[10px] font-medium"
            />
          </div>
        </div>

        {/* 메인: 도서 썸네일 & 판매 정보 */}
        <div className="flex gap-3.5 items-start">
          {/* 도서 썸네일 */}
          <Link
            href={PATHS.BOOK_SALES_DETAIL(String(sale.id))}
            className="relative h-22 w-16 shrink-0 overflow-hidden rounded-md border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 group shadow-2xs"
          >
            {bookCover ? (
              <Image
                src={bookCover}
                alt={sale.title}
                fill
                sizes="64px"
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-stone-400">
                <BookIcon className="h-5 w-5" />
              </div>
            )}
          </Link>

          {/* 도서 텍스트 */}
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
              <p className="text-xs text-stone-400 dark:text-stone-500 line-clamp-1 pt-0.5">
                {sale.content}
              </p>
            )}
          </div>
        </div>

        {/* 하단 바: 금액 + 상태 변경 Select + 액션 메뉴 */}
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
            {/* 상태 변경 Select */}
            <div onClick={handleDropdownClick}>
              <SaleStatusSelect sale={sale} />
            </div>

            {/* 수정 / 삭제 드롭다운 */}
            <div onClick={handleDropdownClick}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 rounded-xl">
                  {isLockedByOrder ? (
                    <DropdownMenuItem
                      disabled
                      className="text-xs text-stone-400"
                    >
                      {tActions("in_trade_cannot_modify")}
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={PATHS.MY_PAGE_SALES_EDIT(String(sale.id))}>
                          <Edit className="mr-2 h-3.5 w-3.5" />
                          <span className="text-xs">{tActions("edit")}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/40 cursor-pointer"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        <span className="text-xs">
                          {isDeleting
                            ? tActions("deleting")
                            : tActions("delete")}
                        </span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 상세 보기 */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 text-xs px-2.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
            >
              <Link href={PATHS.BOOK_SALES_DETAIL(String(sale.id))}>
                상세보기
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
