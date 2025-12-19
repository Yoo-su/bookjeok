"use client";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/query-keys";

import { checkWishlistStatus, getUserStats, getWishlist } from "./apis";

export interface UserStats {
  salesCount: number;
  salesStatusCounts: {
    FOR_SALE?: number;
    RESERVED?: number;
    SOLD?: number;
    WITHDRAWN?: number;
  };
  chatRoomCount: number;
  reviewsCount: number;
}

/**
 * 내 활동 통계를 조회하는 쿼리 훅입니다.
 */
export const useMyStatsQuery = () => {
  return useQuery<UserStats>({
    queryKey: QUERY_KEYS.userKeys.stats.queryKey,
    queryFn: getUserStats,
  });
};

import { WishlistItem } from "./types";

/**
 * 내 위시리스트 목록을 조회하는 쿼리 훅입니다.
 */
export const useWishlistQuery = () => {
  return useQuery<WishlistItem[]>({
    queryKey: QUERY_KEYS.userKeys.wishlist.queryKey,
    queryFn: getWishlist,
  });
};

/**
 * 특정 항목의 위시리스트 포함 여부를 확인하는 쿼리 훅입니다.
 * @param type 타입 (BOOK, SALE)
 * @param id 대상 ID
 * @param enabled 쿼리 활성화 여부 (기본: true)
 */
export const useWishlistStatusQuery = (
  type: "BOOK" | "SALE",
  id: string | number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: QUERY_KEYS.userKeys.wishlistCheck(type, id).queryKey,
    queryFn: () => checkWishlistStatus(type, id),
    enabled,
  });
};
