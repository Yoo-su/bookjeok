"use client";

import { UsedBookSale } from "@bookjeok/core";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { PriceDisplay } from "@/shared/components/ui/price-display";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { formatCurrency } from "@/shared/utils/format-currency";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import { SaleStatusBadge } from "../../common/sale-status-badge";

interface RecentSaleCardProps {
  sale: UsedBookSale;
  priority?: boolean;
}

/**
 * 메인페이지 최신 중고책 슬라이더(모바일 뷰)에서 사용되는 카드 컴포넌트
 */
export const RecentSaleCard = ({
  sale,
  priority = false,
}: RecentSaleCardProps) => {
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const tMarket = useTranslations("market");
  const displayImage =
    sale.imageUrls[0] || sale.book?.image || "/images/placeholder-image.svg";

  const originalPrice = Number(sale.book?.discount);
  const isDiscounted = originalPrice > 0 && sale.price < originalPrice;
  const discountRate = isDiscounted
    ? Math.round(((originalPrice - sale.price) / originalPrice) * 100)
    : 0;

  return (
    <Link
      href={PATHS.BOOK_SALES_DETAIL(String(sale.id))}
      prefetch={false}
      className="group block w-full h-full"
      passHref
    >
      <div className="w-[200px] h-full bg-white border border-neutral-200 overflow-hidden flex flex-col justify-between transition-all duration-300 group-hover:border-neutral-400 group-hover:shadow-md">
        {/* 상단 이미지 영역 */}
        <div className="relative aspect-4/3 w-full bg-neutral-100 overflow-hidden border-b border-neutral-100">
          <Image
            src={displayImage}
            alt={sale.title}
            fill
            sizes="200px"
            priority={priority}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          {isDiscounted && (
            <div className="absolute top-2 left-2 bg-rose-600 text-white font-medium text-[10px] px-1.5 py-0.5 shadow-sm">
              {discountRate}% OFF
            </div>
          )}
          <SaleStatusBadge
            status={sale.status}
            className="absolute right-2 top-2 z-10 shadow-xs text-[10px]"
          />
        </div>

        {/* 하단 텍스트 영역 */}
        <div className="p-3 flex flex-col justify-between flex-1">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-neutral-400 truncate">
              {sale.book?.title}
            </p>
            <h4 className="text-xs font-medium text-neutral-900 line-clamp-1 group-hover:text-neutral-600 transition-colors">
              {sale.title}
            </h4>
          </div>

          {/* 가격 정보 */}
          <div className="flex items-baseline gap-1.5 mt-2">
            <PriceDisplay
              value={sale.price}
              className="text-sm font-semibold text-neutral-900"
              unitClassName="text-xs font-medium"
            />
            {isDiscounted && (
              <span className="text-[10px] text-neutral-400 line-through font-light">
                {formatCurrency(originalPrice, locale, tCommon("won"))}
              </span>
            )}
          </div>

          {/* 판매자 및 지역 푸터 */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar className="h-3.5 w-3.5 shrink-0" data-nosnippet>
                <AvatarImage
                  src={getProfileImageUrl(sale.user?.profileImageUrl)}
                />
                <AvatarFallback className="text-[7px] bg-neutral-200 text-neutral-700">
                  {sale.user?.nickname?.slice(0, 1) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-neutral-600 truncate max-w-[70px]">
                {sale.user?.nickname || tMarket("seller_fallback")}
              </span>
            </div>
            <span className="text-[9px] text-neutral-400 truncate max-w-[80px]">
              {sale.city} {sale.district}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
