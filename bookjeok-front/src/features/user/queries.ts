"use client";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/query-keys";

import {
  checkWishlistStatus,
  getPublicProfile,
  getUserStats,
  getWishlist,
} from "./apis";
import { PublicUserProfile, WishlistItem } from "./types";

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
 * 내 활동 통계 (내 데이터 - 짧은 staleTime)
 */
export const useMyStatsQuery = () => {
  return useQuery<UserStats>({
    queryKey: QUERY_KEYS.userKeys.stats.queryKey,
    queryFn: getUserStats,
    staleTime: 60 * 1000,
  });
};

/**
 * 공개 사용자 프로필 조회
 */
export const usePublicProfileQuery = (
  userId: number,
  enabled: boolean = true
) => {
  return useQuery<PublicUserProfile>({
    queryKey: QUERY_KEYS.userKeys.profile(userId).queryKey,
    queryFn: () => getPublicProfile(userId),
    enabled: enabled && !!userId,
  });
};

/**
 * 내 위시리스트 (내 데이터 - 짧은 staleTime)
 */
export const useWishlistQuery = () => {
  return useQuery<WishlistItem[]>({
    queryKey: QUERY_KEYS.userKeys.wishlist.queryKey,
    queryFn: getWishlist,
    staleTime: 30 * 1000,
  });
};

/**
 * 위시리스트 포함 여부 (내 데이터 - 짧은 staleTime)
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
    staleTime: 30 * 1000,
  });
};
