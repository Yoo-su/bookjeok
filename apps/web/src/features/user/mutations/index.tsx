"use client";

import {
  useAddToWishlistMutation as useSharedAddToWishlistMutation,
  useRemoveFromWishlistMutation as useSharedRemoveFromWishlistMutation,
  useUpdateUserMutation as useSharedUpdateUserMutation,
  useWithdrawMutation as useSharedWithdrawMutation,
} from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { revalidateUserProfile } from "@/shared/actions/revalidate";
import { useRouter } from "@/shared/config/i18n/routing";
import { handleMutationError } from "@/shared/utils/error-handler";
import { purgeRouteCache } from "@/shared/utils/purge-route-cache";

/**
 * 위시리스트 추가 뮤테이션 훅
 */
export const useAddToWishlistMutation = () => {
  const t = useTranslations("wishlist.toast");
  return useSharedAddToWishlistMutation({
    onSuccess: () => {
      toast.success(t("add_success"));
    },
    onError: (error: unknown) => {
      handleMutationError(error, "위시리스트 추가");
    },
  });
};

/**
 * 위시리스트 삭제 뮤테이션 훅
 */
export const useRemoveFromWishlistMutation = () => {
  const t = useTranslations("wishlist.toast");
  return useSharedRemoveFromWishlistMutation({
    onSuccess: () => {
      toast.success(t("delete_success"));
    },
    onError: (error: unknown) => {
      handleMutationError(error, "위시리스트 삭제");
    },
  });
};

/**
 * 사용자 정보 업데이트 뮤테이션 훅
 */
export const useUpdateUserMutation = () => {
  const t = useTranslations("user_profile.toast");
  const router = useRouter();

  return useSharedUpdateUserMutation({
    // 공개 프로필은 1시간 ISR이라 쿼리 무효화만으로는 다른 방문자·크롤러에 닿지 않는다.
    // 핸들은 수정 대상이 아니므로(UpdateUserDto에 없다) 옛 경로를 따로 좇을 필요가 없다.
    onSuccess: (data) => {
      toast.success(t("update_success"));
      void purgeRouteCache(revalidateUserProfile({ handle: data.handle }), () =>
        router.refresh(),
      );
    },
    onError: (error: unknown) => {
      handleMutationError(error, "회원 정보 수정");
    },
  });
};

/**
 * 회원 탈퇴를 처리하는 뮤테이션 훅입니다.
 */
export const useWithdrawMutation = () => {
  const t = useTranslations("user_profile.toast");
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const handle = useAuthStore((state) => state.user?.handle);

  return useSharedWithdrawMutation({
    // 탈퇴는 소프트 삭제라 `/users/{handle}`이 곧바로 404가 되지만, ISR에는 직전
    // 200 HTML이 남아 만료 시각까지 방문자·크롤러에게 탈퇴 회원의 프로필이 나간다.
    // 홈으로 떠나기 전에 먼저 걷어낸다. `window.location` 이동이 진행 중인 서버
    // 액션을 끊으므로 순서가 중요하다. Router Cache는 그 이동이 통째로 버린다.
    onSuccess: async () => {
      toast.success(t("withdraw_success"));

      if (handle) {
        try {
          await revalidateUserProfile({ handle });
        } catch {
          // 재검증 실패는 만료 시각에 어차피 해소된다. 탈퇴 흐름을 막지 않는다.
        }
      }

      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    },
    onError: (error: unknown) => {
      handleMutationError(error, "회원 탈퇴");
    },
  });
};
