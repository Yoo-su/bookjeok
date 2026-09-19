import { UsedBookSale } from "@bookjeok/core";

import { formatCurrency } from "@/shared/utils/format-currency";

export function getBookSaleShareData(
  sale: UsedBookSale,
  locale: string,
  unit: string,
  status: string,
) {
  return {
    title: sale.title,
    description: [
      sale.book?.title,
      formatCurrency(sale.price, locale, unit),
      status,
      [sale.city, sale.district].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(" | "),
    imageUrl: sale.imageUrls?.[0] || sale.book?.image || undefined,
  };
}
