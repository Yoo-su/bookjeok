import { Notification, notificationKeys } from "@bookjeok/core";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";

import { getNotificationMessageParams } from "../utils";

export const useNotificationActions = () => {
  const t = useTranslations("notification");
  const queryClient = useQueryClient();

  const handleNewNotification = useCallback(
    (notification: Notification) => {
      // 1. 데이터 갱신 (Refetch)
      queryClient.invalidateQueries({ queryKey: notificationKeys._def });

      // 2. UI 피드백 (Toast)
      const { key, params } = getNotificationMessageParams(notification, {
        actor: t("fallback_actor"),
        cancelReason: t("fallback_cancel_reason"),
      });
      const message = t(key, params);

      toast.info(message);
    },
    [queryClient, t],
  );

  return {
    handleNewNotification,
  };
};
