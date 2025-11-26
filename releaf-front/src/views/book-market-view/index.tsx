"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";

import { BookSaleFilter } from "@/features/book/components/book-sale-filter";
import { BookSaleGrid } from "@/features/book/components/book-sale-grid";
import { useBookSaleSearchParams } from "@/features/book/hooks/use-book-sale-search-params";

const MAX_PRICE = 100000;

const BookMarketClientView = () => {
  const router = useRouter();
  const pathname = usePathname();
  const filterParams = useBookSaleSearchParams();

  const handleApplyFilters = (data: any) => {
    const params = new URLSearchParams();
    if (data.search) params.set("search", data.search);
    if (data.city !== "all") params.set("city", data.city);
    if (data.district !== "all") params.set("district", data.district);
    data.status.forEach((s: string) => params.append("status", s));
    if (data.priceRange[0] > 0)
      params.set("minPrice", String(data.priceRange[0]));
    if (data.priceRange[1] < MAX_PRICE)
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

export const BookMarketView = () => {
  return (
    <div className="w-full py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          중고 서적 마켓
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          원하는 책을 찾아보세요! 다양한 중고 서적들이 있습니다.
        </p>
      </header>
      <main>
        <Suspense
          fallback={
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
            </div>
          }
        >
          <BookMarketClientView />
        </Suspense>
      </main>
    </div>
  );
};
