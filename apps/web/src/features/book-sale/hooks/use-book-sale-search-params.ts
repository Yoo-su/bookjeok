"use client";

import {
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  FILTER_ALL,
  FilterFormInputs,
  MAX_MARKET_PRICE,
  SaleStatus,
  SearchBookSalesParams,
  SortBy,
  SortOrder,
  VALID_SALE_STATUSES,
  VALID_SORT_BY,
  VALID_SORT_ORDER,
} from "@bookjeok/core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

/**
 * URL에서 안전하게 숫자를 파싱하는 유틸리티
 * - NaN이면 undefined를 반환하여 잘못된 값이 API로 전달되는 것을 방지
 */
const parseNumber = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

/**
 * URL에서 유효한 SaleStatus 값만 필터링하는 유틸리티
 * - 유효하지 않은 상태값(예: "INVALID")은 무시
 */
const parseStatuses = (values: string[]): SaleStatus[] => {
  return values.filter((v) => VALID_SALE_STATUSES.has(v)) as SaleStatus[];
};

/**
 * URL에서 sortBy를 안전하게 파싱하는 유틸리티
 */
const parseSortBy = (value: string | null): SortBy | undefined => {
  if (!value || !VALID_SORT_BY.has(value)) return undefined;
  return value as SortBy;
};

/**
 * URL에서 sortOrder를 안전하게 파싱하는 유틸리티
 */
const parseSortOrder = (value: string | null): SortOrder | undefined => {
  if (!value || !VALID_SORT_ORDER.has(value)) return undefined;
  return value as SortOrder;
};

interface UseBookSaleSearchParamsReturn {
  /** URL에서 파싱된 검색 파라미터 (읽기) */
  params: SearchBookSalesParams;
  /** 필터 폼 데이터를 URL에 반영 (쓰기) */
  updateParams: (data: FilterFormInputs) => void;
  /** 모든 필터를 초기화 */
  resetParams: () => void;
}

/**
 * 중고책 마켓의 URL search params를 읽고 쓰는 통합 훅
 *
 * - 읽기: URL → SearchBookSalesParams (유효성 검증 포함)
 * - 쓰기: FilterFormInputs → URL 업데이트
 *
 * 참고: lat/lng는 URL에 포함하지 않고 useUserLocation 훅에서 관리합니다.
 */
export const useBookSaleSearchParams = (): UseBookSaleSearchParamsReturn => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL → SearchBookSalesParams 파싱 (유효성 검증 포함)
  const params: SearchBookSalesParams = useMemo(() => {
    const result: SearchBookSalesParams = {};

    const search = searchParams.get("search");
    const city = searchParams.get("city");
    const district = searchParams.get("district");
    const status = parseStatuses(searchParams.getAll("status"));
    const sortBy = parseSortBy(searchParams.get("sortBy"));
    const sortOrder = parseSortOrder(searchParams.get("sortOrder"));
    const minPrice = parseNumber(searchParams.get("minPrice"));
    const maxPrice = parseNumber(searchParams.get("maxPrice"));

    if (search) result.search = search;
    if (city) result.city = city;
    if (district) result.district = district;
    if (status.length > 0) result.status = status;
    if (sortBy) result.sortBy = sortBy;
    if (sortOrder) result.sortOrder = sortOrder;
    if (minPrice !== undefined) result.minPrice = minPrice;
    if (maxPrice !== undefined) result.maxPrice = maxPrice;

    return result;
  }, [searchParams]);

  // FilterFormInputs → URL 업데이트
  const updateParams = useCallback(
    (data: FilterFormInputs) => {
      const newParams = new URLSearchParams();

      if (data.search) newParams.set("search", data.search);
      if (data.city !== FILTER_ALL) newParams.set("city", data.city);
      if (data.district !== FILTER_ALL)
        newParams.set("district", data.district);
      data.status.forEach((s) => newParams.append("status", s));
      if (data.priceRange[0] > 0)
        newParams.set("minPrice", String(data.priceRange[0]));
      if (data.priceRange[1] < MAX_MARKET_PRICE)
        newParams.set("maxPrice", String(data.priceRange[1]));

      // 정렬 옵션 처리 (기본값이 아닌 경우만 URL에 포함)
      const [sortBy, sortOrder] = data.sort.split("_") as [SortBy, SortOrder];
      if (sortBy !== DEFAULT_SORT_BY || sortOrder !== DEFAULT_SORT_ORDER) {
        newParams.set("sortBy", sortBy);
        newParams.set("sortOrder", sortOrder);
      }

      const queryString = newParams.toString();
      router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, {
        scroll: false,
      });
    },
    [router, pathname],
  );

  // 모든 필터 초기화
  const resetParams = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  return { params, updateParams, resetParams };
};
