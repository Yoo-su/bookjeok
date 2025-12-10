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
    // 거리순 정렬(distance_ASC)이 선택된 경우 위치 정보를 요청합니다.
    if (data.sort === "distance_ASC") {
      if (!navigator.geolocation) {
        alert("이 브라우저에서는 위치 기반 기능을 지원하지 않습니다.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          params.set("lat", String(position.coords.latitude));
          params.set("lng", String(position.coords.longitude));
          params.set("radius", "5000"); // 기본 반경 5km
          params.set("sortBy", "distance"); // 서버 정렬 기준 설정
          router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        () => {
          alert("위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.");
        }
      );
      return; // 비동기 위치 요청 대기 위해 함수 종료
    }

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
