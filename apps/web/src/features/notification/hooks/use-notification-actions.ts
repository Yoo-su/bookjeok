import {
  Notification,
  notificationKeys,
  NotificationType,
  readingLogKeys,
} from "@bookjeok/core";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";

import { getNotificationMessageParams } from "../utils";

export const useNotificationActions = () => {
  const t = useTranslations("notification");
  const queryClient = useQueryClient();

  /** 알림 목록과 안 읽은 개수를 서버 기준으로 다시 조회합니다. */
  const syncNotifications = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: notificationKeys._def });
  }, [queryClient]);

  const handleNewNotification = useCallback(
    (notification: Notification) => {
      // 1. 데이터 갱신 (Refetch)
      syncNotifications();
      // 독서기록 hero의 받은 콩 수가 바로 늘게
      if (notification.type === NotificationType.READING_LOG_KONG) {
        queryClient.invalidateQueries({
          queryKey: readingLogKeys.kongsReceived.queryKey,
        });
      }

      // 2. UI 피드백 (Toast)
      const { key, params } = getNotificationMessageParams(notification, {
        actor: t("fallback_actor"),
        cancelReason: t("fallback_cancel_reason"),
      });
      const message = t(key, params);

      toast.info(message);
    },
    [queryClient, syncNotifications, t],
  );

  return {
    handleNewNotification,
    syncNotifications,
  };
};
