"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ReactNode } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { PriceDisplay } from "@/shared/components/ui/price-display";
import { cn } from "@/shared/utils/cn";
import { formatCurrency } from "@/shared/utils/format-currency";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import { SaleStatusBadge } from "../sale-status-badge";
import { useBookSaleContext } from "./context";

// 이미지 영역 - 깔끔한 상단 직각 썸네일
export const ImageArea = ({ className }: { className?: string }) => {
  const { sale, rank, priority } = useBookSaleContext();

  const originalPrice = Number(sale.book?.discount);
  const isDiscounted = originalPrice > 0 && sale.price < originalPrice;
  const discountRate = isDiscounted
    ? Math.round(((originalPrice - sale.price) / originalPrice) * 100)
    : 0;

  return (
    <div
      className={cn(
        "relative aspect-4/3 w-full overflow-hidden bg-neutral-100 border-b border-neutral-100",
        className,
      )}
    >
      <Image
        src={
          sale.imageUrls[0] ||
          sale.book?.image ||
          "/images/placeholder-image.svg"
        }
        alt={sale.title}
        title={sale.title}
        fill
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />

      {/* 좌상단 랭킹 배지 (있을 경우) */}
      {rank && (
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-0.5 bg-[#2C2C2C] text-white text-xs font-sans font-bold shadow-xs">
            {rank}
          </span>
        </div>
      )}

      {/* 좌하단 할인율 뱃지 (있을 경우) */}
      {isDiscounted && discountRate > 0 && !rank && (
        <div className="absolute bottom-2 left-2 z-10">
          <span className="px-1.5 py-0.5 bg-[#2C2C2C] text-white text-[10px] font-sans font-bold shadow-xs">
            -{discountRate}%
          </span>
        </div>
      )}

      {/* 상태 배지 - 우상단 */}
      <SaleStatusBadge
        status={sale.status}
        className="absolute right-2 top-2 z-10 shadow-xs text-[10px]"
      />
    </div>
  );
};

// 콘텐츠 영역 - 하단 화이트 카드 영역
export const Content = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "p-3.5 sm:p-4 flex flex-col justify-between flex-1 bg-white space-y-2",
        className,
      )}
    >
      {children}
    </div>
  );
};

// 제목
export const Title = ({ className }: { className?: string }) => {
  const { sale } = useBookSaleContext();
  return (
    <div>
      <h3
        className={cn(
          "line-clamp-1 text-sm font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors leading-snug",
          className,
        )}
      >
        {sale.title}
      </h3>
      {sale.book?.title && (
        <p className="text-[11px] text-neutral-400 font-light truncate mt-0.5">
          {sale.book.title}
          {sale.book.author ? ` · ${sale.book.author}` : ""}
        </p>
      )}
    </div>
  );
};

// 가격 - 선명한 타이포그래피
export const Price = ({ className }: { className?: string }) => {
  const t = useTranslations("common");
  const locale = useLocale();
  const { sale } = useBookSaleContext();

  const originalPrice = Number(sale.book?.discount);
  const isDiscounted = originalPrice > 0 && sale.price < originalPrice;

  return (
    <div className={cn("flex items-baseline gap-1.5", className)}>
      <PriceDisplay
        value={sale.price}
        className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight leading-none"
        unitClassName="text-xs font-medium"
      />
      {isDiscounted && (
        <span className="text-xs text-neutral-400 line-through font-light">
          {formatCurrency(originalPrice, locale, t("won"))}
        </span>
      )}
    </div>
  );
};

// 위치 정보 (단독 컴포넌트 호출 시)
export const Location = ({ className }: { className?: string }) => {
  const { sale } = useBookSaleContext();
  if (!sale.city && !sale.district) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-[11px] text-neutral-400 font-light",
        className,
      )}
    >
      <span>
        {sale.city} {sale.district}
      </span>
    </div>
  );
};

// 메타 정보 - 판매자 아바타 & 지역 / 조회수
export const Meta = ({ className }: { className?: string }) => {
  const t = useTranslations("market");
  const { sale } = useBookSaleContext();
  return (
    <div
      className={cn(
        "flex items-center justify-between pt-2.5 border-t border-neutral-100 text-xs",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <Avatar className="h-4 w-4 shrink-0" data-nosnippet>
          <AvatarImage src={getProfileImageUrl(sale.user?.profileImageUrl)} />
          <AvatarFallback className="text-[8px] bg-neutral-200 text-neutral-700">
            {sale.user?.nickname?.slice(0, 1) || "U"}
          </AvatarFallback>
        </Avatar>
        <span className="text-[11px] text-neutral-600 truncate max-w-[85px]">
          {sale.user?.nickname || t("seller_fallback")}
        </span>
      </div>
      <span className="text-[10px] text-neutral-400 truncate max-w-[100px]">
        {sale.city} {sale.district}
      </span>
    </div>
  );
};

// 기존 호출부 호환용 컴포넌트
export const Effect = ({
  duration: _duration,
  delay: _delay,
}: {
  duration?: number;
  delay?: number;
}) => {
  return null;
};
