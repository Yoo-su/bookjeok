"use client";

import {
  useBookSaleRegionsQuery,
  useRecentBookSalesQuery,
} from "@bookjeok/react-query";
import { useMemo } from "react";

/** 홈 슬라이더와 캐시를 공유하기 위해 동일한 limit 사용 */
const RECENT_LIMIT = 25;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
/** 히어로는 실시간성이 중요하므로 전역 staleTime(1분)을 더 짧게 덮어쓴다. */
const LIVE_REFRESH_MS = 60 * 1000;

export interface MarketHeroSeller {
  imageUrl: string | null;
  name: string;
}

/**
 * 마켓 히어로에 노출하는 실데이터 지표(신규 등록, 거래 지역, 판매자 아바타).
 * market-hero, video-hero가 함께 사용한다.
 */
export function useMarketHeroStats() {
  const { data: recentSales, isLoading } = useRecentBookSalesQuery(
    RECENT_LIMIT,
    {
      staleTime: LIVE_REFRESH_MS,
      refetchInterval: LIVE_REFRESH_MS,
      refetchOnMount: true,
    },
  );
  const { data: regions } = useBookSaleRegionsQuery();

  // `?? []`로는 부족하다. 백엔드가 형태가 어긋난 200을 주면 배열이 아닌 값이
  // 그대로 통과해 아래 filter에서 터지고, 페이지 전체가 500이 된다.
  const sales = useMemo(
    () => (Array.isArray(recentSales) ? recentSales : []),
    [recentSales],
  );

  const { freshCount, newTodayLabel, regionCount, sellers } = useMemo(() => {
    const now = Date.now();
    const freshCount = sales.filter(
      (sale) => now - new Date(sale.createdAt).getTime() < DAY_IN_MS,
    ).length;

    const uniqueSellers = new Map<number, MarketHeroSeller>();
    for (const sale of sales) {
      if (!sale.user || uniqueSellers.has(sale.user.id)) continue;
      uniqueSellers.set(sale.user.id, {
        imageUrl: sale.user.profileImageUrl,
        name: sale.user.nickname,
      });
    }

    return {
      freshCount,
      newTodayLabel:
        freshCount >= RECENT_LIMIT ? `${RECENT_LIMIT}+` : String(freshCount),
      regionCount: regions
        ? Object.values(regions).reduce(
            (total, districts) =>
              total + (Array.isArray(districts) ? districts.length : 0),
            0,
          )
        : 0,
      sellers: [...uniqueSellers.values()],
    };
  }, [sales, regions]);

  const hasStats = freshCount > 0 || regionCount > 0 || sellers.length > 0;

  return {
    sales,
    isLoading,
    freshCount,
    newTodayLabel,
    regionCount,
    sellers,
    hasStats,
  };
}
