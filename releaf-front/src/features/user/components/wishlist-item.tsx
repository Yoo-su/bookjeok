import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SaleStatusBadge } from "@/features/book/components/common/sale-status-badge";
import { WishlistButton } from "@/features/user/components/wishlist-button";
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import { Card } from "@/shared/components/shadcn/card";
import { PATHS } from "@/shared/constants/paths";

import { WishlistItem as WishlistItemType } from "../types";

interface WishlistItemProps {
  item: WishlistItemType;
}

export const WishlistItem = ({ item }: WishlistItemProps) => {
  // 1. 책 찜하기인 경우
  if (item.book) {
    return (
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="flex flex-row">
          <div className="relative w-24 h-32 sm:w-32 sm:h-40 shrink-0">
            <Image
              src={item.book.image}
              alt={item.book.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-between flex-1 p-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="outline" className="mb-2">
                    도서
                  </Badge>
                  <h3 className="font-bold line-clamp-1">{item.book.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {item.book.author} | {item.book.publisher}
                  </p>
                </div>
                <WishlistButton
                  type="BOOK"
                  id={item.book.isbn}
                  className="text-red-500 hover:bg-red-50"
                />
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <Button asChild size="sm" variant="secondary">
                <Link href={PATHS.BOOK_DETAIL(item.book.isbn)}>상세보기</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // 2. 중고 판매글 찜하기인 경우
  if (item.usedBookSale) {
    const sale = item.usedBookSale;
    const isSoldOut = sale.status === "SOLD";

    return (
      <Card
        className={`overflow-hidden transition-shadow hover:shadow-md ${
          isSoldOut ? "opacity-60 bg-gray-50" : ""
        }`}
      >
        <div className="flex flex-row">
          <div className="relative w-24 h-32 sm:w-32 sm:h-40 shrink-0 bg-gray-100 flex items-center justify-center">
            {sale.imageUrls?.[0] ? (
              <Image
                src={sale.imageUrls[0]}
                alt={sale.title}
                fill
                className="object-cover"
              />
            ) : (
              <ShoppingBag className="w-8 h-8 text-gray-300" />
            )}
            {isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="font-bold text-white">판매완료</span>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between flex-1 p-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex gap-2 mb-2">
                    <Badge variant="secondary">중고거래</Badge>
                    <SaleStatusBadge status={sale.status} />
                  </div>
                  <h3 className="font-bold line-clamp-1">{sale.title}</h3>
                  <p className="font-bold text-emerald-600">
                    {sale.price.toLocaleString()}원
                  </p>
                </div>
                <WishlistButton
                  type="SALE"
                  id={sale.id}
                  className="text-red-500 hover:bg-red-50"
                />
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <Button
                asChild
                size="sm"
                variant="secondary"
                disabled={isSoldOut}
              >
                <Link href={PATHS.BOOK_SALES_DETAIL(String(sale.id))}>
                  {isSoldOut ? "판매 종료" : "상세보기"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return null;
};
