"use client";

import { useCallback } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { saveReturnUrl } from "@/features/auth/utils/return-url";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import {
  FeedbackPreset,
  useFeedbackDialogStore,
} from "../stores/use-feedback-dialog-store";

/**
 * 문의 창을 연다. 비로그인이면 로그인 화면으로 보내고 지금 페이지로 돌아오게 한다
 */
export const useOpenFeedback = () => {
  const user = useAuthStore((state) => state.user);
  const open = useFeedbackDialogStore((state) => state.open);
  const router = useRouter();

  return useCallback(
    (preset?: FeedbackPreset) => {
      if (!user) {
        saveReturnUrl(`${window.location.pathname}${window.location.search}`);
        router.push(PATHS.LOGIN);
        return;
      }
      open(preset);
    },
    [user, open, router],
  );
};
