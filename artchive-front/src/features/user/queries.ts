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
}

export const useMyStatsQuery = () => {
  return useQuery<UserStats>({
    queryKey: QUERY_KEYS.userKeys.stats.queryKey,
    queryFn: getUserStats,
  });
};

import { WishlistItem } from "./types";

export const useWishlistQuery = () => {
  return useQuery<WishlistItem[]>({
    queryKey: QUERY_KEYS.userKeys.wishlist.queryKey,
    queryFn: getWishlist,
  });
};

export const useWishlistStatusQuery = (
  type: "BOOK" | "SALE",
  id: string | number
) => {
  return useQuery({
    queryKey: QUERY_KEYS.userKeys.wishlistCheck(type, id).queryKey,
    queryFn: () => checkWishlistStatus(type, id),
  });
};
