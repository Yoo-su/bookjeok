import { privateAxios } from "@/shared/libs/axios";

import { BookInfo } from "../book/types";
import { UserStats } from "./queries";

export const getUserStats = async (): Promise<UserStats> => {
  const { data } = await privateAxios.get<UserStats>("/user/stats");
  return data;
};

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

export const getWishlist = async () => {
  const { data } = await privateAxios.get<WishlistItem[]>("/user/wishlist");
  return data;
};

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
