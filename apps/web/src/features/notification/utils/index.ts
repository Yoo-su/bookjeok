import { type Notification } from "@bookjeok/core";

import {
  getNotificationDefinition,
  type NotificationFallbacks,
  type NotificationMessageKey,
} from "./definitions";

/** 사람이 아니라 북적이 보내는 알림. 행위자 대신 북적 로고·이름을 보인다 */
export const isSystemNotification = (notification: Notification) =>
  getNotificationDefinition(notification.type)?.system ?? false;

export const getNotificationMessageParams = (
  notification: Notification,
  fallbacks: NotificationFallbacks,
): { key: NotificationMessageKey; params: Record<string, string> } => {
  const definition = getNotificationDefinition(notification.type);
  // 배포 버전 차이로 아직 모르는 타입을 받았을 때의 기존 표시를 유지한다.
  if (!definition) return { key: "default", params: {} };
  return {
    key: definition.messageKey,
    params: definition.params(
      notification.metadata,
      notification.actor?.nickname ?? fallbacks.actor,
      fallbacks,
    ),
  };
};

export const getNotificationLink = (notification: Notification): string =>
  getNotificationDefinition(notification.type)?.link(notification.metadata) ??
  "#";
