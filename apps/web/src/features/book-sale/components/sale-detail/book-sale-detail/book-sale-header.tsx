import { formatPostDate, UsedBookSale } from "@bookjeok/core";
import { useLocale, useTranslations } from "next-intl";

import { Clock, Eye, MapPin } from "@/shared/components/icons/iconsax";
import { PriceDisplay } from "@/shared/components/ui/price-display";
import { formatCurrency } from "@/shared/utils/format-currency";

import { SaleStatusBadge } from "../../common/sale-status-badge";
import { TradeMethodBadge } from "../../common/trade-method-badge";

interface BookSaleHeaderProps {
  sale: UsedBookSale;
}

/** 판매글 헤더: 판매상태 뱃지 + 거래방식 뱃지 + 제목 + 가격 + 메타 태그(지역/날짜/조회수) */
export const BookSaleHeader = ({ sale }: BookSaleHeaderProps) => {
  const t = useTranslations("market.detail");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const displayDate =
    sale.updatedAt > sale.createdAt ? sale.updatedAt : sale.createdAt;
  const dateLabel =
    sale.updatedAt > sale.createdAt ? t("status.edited") : t("status.created");

  const originalPrice = Number(sale.book.discount);
  const isDiscounted = originalPrice > 0 && sale.price < originalPrice;
  const isPremiumOrNormal = originalPrice > 0 && sale.price >= originalPrice;

  const discountRate = isDiscounted
    ? Math.round(((originalPrice - sale.price) / originalPrice) * 100)
    : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <SaleStatusBadge status={sale.status} />
        <TradeMethodBadge tradeMethod={sale.tradeMethod} />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 leading-snug break-keep">
        {sale.title}
      </h1>
      <div className="mt-6 flex flex-col gap-0 border-y border-stone-200">
        {isDiscounted ? (
          <div className="flex flex-col py-4 gap-2">
            <div className="flex items-end justify-between">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none">
                {t("originalPrice")}
              </span>
              <span className="text-sm font-medium text-stone-400 line-through decoration-1 leading-none">
                {formatCurrency(originalPrice, locale, tCommon("won"))}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mt-1">
              <span className="self-end sm:self-auto text-[11px] font-black text-white bg-stone-900 px-2 py-1 tracking-widest leading-none">
                -{discountRate}% {t("discount")}
              </span>
              <PriceDisplay
                value={sale.price}
                className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tighter leading-none"
                unitClassName="text-xl sm:text-2xl font-bold text-stone-800"
              />
            </div>
          </div>
        ) : isPremiumOrNormal ? (
          <div className="flex flex-col py-4 gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                {t("originalPrice")}{" "}
                {formatCurrency(originalPrice, locale, tCommon("won"))}
              </span>
              <PriceDisplay
                value={sale.price}
                className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tighter leading-none"
                unitClassName="text-xl sm:text-2xl font-bold text-stone-800"
              />
            </div>
          </div>
        ) : (
          <div className="py-4 text-right">
            <PriceDisplay
              value={sale.price}
              className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tighter leading-none"
              unitClassName="text-xl sm:text-2xl font-bold text-stone-800"
            />
          </div>
        )}
      </div>

      {/* 메타 정보 영역: 필(pill) 태그 스타일 */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
          <MapPin className="w-3 h-3" />
          {sale.city} {sale.district}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
          <Clock className="w-3 h-3" />
          {dateLabel} {formatPostDate(displayDate, locale)}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
          <Eye className="w-3 h-3" />
          {sale.viewCount.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
