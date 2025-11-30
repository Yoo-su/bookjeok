import { privateAxios } from "@/shared/libs/axios";

import { BookInfo } from "../book/types";
import { UserStats } from "./queries";

/**
 * 사용자의 활동 통계(판매, 채팅, 리뷰 수 등)를 조회합니다.
 * @returns 사용자 통계 정보
 */
export const getUserStats = async (): Promise<UserStats> => {
  const { data } = await privateAxios.get<UserStats>("/user/stats");
  return data;
};

/**
 * 위시리스트에 항목을 추가합니다.
 * @param type 타입 (BOOK, SALE)
 * @param id 대상 ID
 * @param bookData 책 정보 (책이 DB에 없을 경우 생성용)
 * @returns 추가된 위시리스트 항목
 */
export const addToWishlist = async (
  type: "BOOK" | "SALE",
  id: string | number,
  bookData?: BookInfo
) => {
  const { data } = await privateAxios.post("/user/wishlist", {
    type,
    id,
    bookData,
  });
  return data;
};

/**
 * 위시리스트에서 항목을 제거합니다.
 * @param type 타입 (BOOK, SALE)
 * @param id 대상 ID
 * @returns 제거된 항목
 */
export const removeFromWishlist = async (
  type: "BOOK" | "SALE",
  id: string | number
) => {
  const { data } = await privateAxios.delete("/user/wishlist", {
    params: { type, id },
  });
  return data;
};

import { WishlistItem } from "./types";

/**
 * 내 위시리스트 목록을 조회합니다.
 * @returns 위시리스트 목록
 */
export const getWishlist = async () => {
  const { data } = await privateAxios.get<WishlistItem[]>("/user/wishlist");
  return data;
};

/**
 * 특정 항목이 위시리스트에 있는지 확인합니다.
 * @param type 타입 (BOOK, SALE)
 * @param id 대상 ID
 * @returns 위시리스트 포함 여부
 */
export const checkWishlistStatus = async (
  type: "BOOK" | "SALE",
  id: string | number
) => {
  const { data } = await privateAxios.get<{ isWishlisted: boolean }>(
    "/user/wishlist/check",
    {
      params: { type, id },
    }
  );
  return data;
};
