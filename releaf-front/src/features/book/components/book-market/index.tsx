"use client";

import { usePathname, useRouter } from "next/navigation";

import { BookSaleFilter } from "@/features/book/components/book-sale-filter";
import { BookSaleGrid } from "@/features/book/components/book-sale-grid";
import { useBookSaleSearchParams } from "@/features/book/hooks/use-book-sale-search-params";
import { FilterFormInputs } from "@/features/book/types";

import { MAX_MARKET_PRICE } from "../../constants";

export const BookMarket = () => {
  const router = useRouter();
  const pathname = usePathname();
  const filterParams = useBookSaleSearchParams();

  const handleApplyFilters = (data: FilterFormInputs) => {
    const params = new URLSearchParams();
    if (data.search) params.set("search", data.search);
    if (data.city !== "all") params.set("city", data.city);
    if (data.district !== "all") params.set("district", data.district);
    data.status.forEach((s: string) => params.append("status", s));
    if (data.priceRange[0] > 0)
      params.set("minPrice", String(data.priceRange[0]));
    if (data.priceRange[1] < MAX_MARKET_PRICE)
      params.set("maxPrice", String(data.priceRange[1]));
    const [sortBy, sortOrder] = data.sort.split("_");
    if (sortBy !== "createdAt" || sortOrder !== "DESC") {
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleResetFilters = () => {
    router.push(pathname, { scroll: false });
  };

  return (
    <>
      <BookSaleFilter
        initialParams={filterParams}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
      <BookSaleGrid filterParams={filterParams} />
    </>
  );
};
