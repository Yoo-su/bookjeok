import {
  API_PATHS,
  PublicUserProfile,
  UpdateUserProfileParams,
  UserStats,
  WishlistItem,
} from "@bookjeok/core";

import { privateApiClient, publicApiClient } from "../../client";

/**
 * 특정 사용자의 공개 프로필을 조회합니다.
 */
export const getPublicUserProfile = async (
  handle: string,
): Promise<PublicUserProfile> => {
  const { data } = await publicApiClient.get<PublicUserProfile>(
    API_PATHS.user.publicProfile(handle),
  );
  return data;
};

/**
 * 내 찜 목록을 조회합니다.
 */
export const getMyWishlist = async (): Promise<WishlistItem[]> => {
  const { data } = await privateApiClient.get<WishlistItem[]>(
    API_PATHS.user.wishlist,
  );
  return data;
};

/**
 * 특정 대상(도서 또는 판매글)을 찜하거나 취소합니다.
 */
export const toggleWishlist = async (payload: {
  isbn?: string;
  saleId?: number;
}): Promise<{ added: boolean }> => {
  const { data } = await privateApiClient.post<{ added: boolean }>(
    API_PATHS.user.wishlist,
    payload,
  );
  return data;
};

/**
 * 특정 항목이 위시리스트에 있는지 확인합니다.
 */
export const checkWishlistStatus = async (
  type: "BOOK" | "SALE",
  id: string | number,
): Promise<boolean> => {
  const { data } = await privateApiClient.get<{ isWishlisted: boolean }>(
    API_PATHS.user.wishlistCheck,
    {
      params: { type, id },
    },
  );
  return data.isWishlisted;
};

/**
 * 사용자의 활동 통계(판매, 채팅, 리뷰 수 등)를 조회합니다.
 */
export const getUserStats = async (): Promise<UserStats> => {
  const { data } = await privateApiClient.get<UserStats>(API_PATHS.user.stats);
  return data;
};

/**
 * 내 프로필 정보를 조회합니다.
 */
export const getMyProfile = async (): Promise<
  PublicUserProfile & { email: string; isReadingLogPublic: boolean }
> => {
  const { data } = await privateApiClient.get(API_PATHS.user.profile);
  return data;
};

/**
 * 내 프로필 정보를 수정합니다.
 */
export const updateProfile = async (
  params: UpdateUserProfileParams,
): Promise<
  PublicUserProfile & { email: string; isReadingLogPublic: boolean }
> => {
  const { data } = await privateApiClient.patch<
    PublicUserProfile & { email: string; isReadingLogPublic: boolean }
  >(API_PATHS.user.base, params);
  return data;
};

/**
 * 닉네임 사용 가능 여부를 확인합니다.
 * (privateApiClient를 사용하여 회원인 경우 내 닉네임 유효성 검사 지원)
 */
export const checkNickname = async (
  nickname: string,
): Promise<{ available: boolean }> => {
  const { data } = await privateApiClient.get<{ available: boolean }>(
    API_PATHS.user.checkNickname,
    { params: { nickname } },
  );
  return data;
};

/**
 * 위시리스트에 항목을 추가합니다.
 */
export const addToWishlist = async (
  type: "BOOK" | "SALE",
  id: string | number,
): Promise<WishlistItem> => {
  const { data } = await privateApiClient.post<WishlistItem>(
    API_PATHS.user.wishlist,
    {
      type,
      id: String(id),
    },
  );
  return data;
};

/**
 * 위시리스트에서 항목을 제거합니다.
 */
export const removeFromWishlist = async (
  type: "BOOK" | "SALE",
  id: string | number,
): Promise<void> => {
  await privateApiClient.delete(API_PATHS.user.wishlist, {
    params: { type, id },
  });
};

/**
 * 회원 탈퇴를 처리합니다.
 */
export const withdraw = async (): Promise<void> => {
  await privateApiClient.delete(API_PATHS.user.me);
};
