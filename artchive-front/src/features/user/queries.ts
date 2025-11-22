"use client";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/query-keys";

import { getUserStats } from "./apis";

export interface UserStats {
  salesCount: number;
  salesStatusCounts: {
    FOR_SALE?: number;
    RESERVED?: number;
    SOLD?: number;
    WITHDRAWN?: number;
  };
  chatRoomCount: number;
}

export const useMyStatsQuery = () => {
  return useQuery<UserStats>({
    queryKey: QUERY_KEYS.userKeys.stats.queryKey,
    queryFn: getUserStats,
  });
};
