"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/store";
import { privateAxios } from "@/shared/libs/axios";

import { BookInfo } from "../book/types";
import { addToWishlist, removeFromWishlist } from "./apis";

/**
 * 회원 탈퇴를 처리하는 뮤테이션 훅입니다.
 * 탈퇴 성공 시 로그아웃 처리하고 홈으로 이동합니다.
 */
export const useWithdrawMutation = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async () => {
      const response = await privateAxios.delete("/user/me");
      return response.data;
    },
    onSuccess: () => {
      toast.success(
        "회원 탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다."
      );
      clearAuth();
      location.href = "/";
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "회원 탈퇴 중 오류가 발생했습니다."
      );
    },
  });
};

/**
 * 위시리스트에 추가하는 뮤테이션 훅입니다.
 */
export const useAddToWishlistMutation = () => {
  return useMutation({
    mutationFn: ({
      type,
      id,
      bookData,
    }: {
      type: "BOOK" | "SALE";
      id: string | number;
      bookData?: BookInfo;
    }) => addToWishlist(type, id, bookData),
  });
};

/**
 * 위시리스트에서 제거하는 뮤테이션 훅입니다.
 */
export const useRemoveFromWishlistMutation = () => {
  return useMutation({
    mutationFn: ({
      type,
      id,
    }: {
      type: "BOOK" | "SALE";
      id: string | number;
    }) => removeFromWishlist(type, id),
  });
};
