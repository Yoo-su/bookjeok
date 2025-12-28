import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/query-keys";

import { getInsights, getLocationSales } from "./apis";

/**
 * 서비스 인사이트 데이터 조회 (SSR prefetch)
 */
export const useInsightsQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.insightsKeys.all.queryKey,
    queryFn: getInsights,
  });
};

/**
 * 지역별 판매글 조회 (버튼 클릭 시 동적 요청)
 */
export const useLocationSalesQuery = (city: string, district: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.insightsKeys.locationSales(city, district).queryKey,
    queryFn: () => getLocationSales(city, district),
    enabled: !!city && !!district,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
