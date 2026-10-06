import { type NotificationMetadata, NotificationType } from "@bookjeok/core";

import { readingLogHref } from "@/features/reading-log/utils/reading-log-link";
import { PATHS } from "@/shared/constants/paths";
import type en from "@/shared/i18n/messages/en.json";
import type ko from "@/shared/i18n/messages/ko.json";
import { parseCalendarDate } from "@/shared/utils/format-date";

type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];
export type NotificationMessageKey = StringKeys<typeof ko.notification> &
  StringKeys<typeof en.notification>;
export type NotificationFallbacks = { actor: string; cancelReason: string };

type NotificationDefinition<T extends NotificationType> = {
  messageKey: NotificationMessageKey;
  system: boolean;
  params: (
    metadata: NotificationMetadata<T>,
    actorName: string,
    fallbacks: NotificationFallbacks,
  ) => Record<string, string>;
  link: (metadata: NotificationMetadata<T>) => string;
};

type NotificationDefinitions = {
  [T in NotificationType]: NotificationDefinition<T>;
};

const actorParams = (_metadata: unknown, actorName: string) => ({ actorName });
const noParams = () => ({});
const reviewLink = (metadata: { reviewId: number | null }) =>
  metadata.reviewId ? PATHS.REVIEW_DETAIL(metadata.reviewId) : "#";
const orderTarget = (metadata: { orderId: string; orderNumber?: string }) =>
  metadata.orderNumber || (metadata.orderId ? String(metadata.orderId) : null);
const orderLink = (
  metadata: { orderId: string; orderNumber?: string },
  fallback: string,
) => {
  const target = orderTarget(metadata);
  return target ? PATHS.ORDER_DETAIL(target) : fallback;
};

/** 문구·이동·행위자 표시를 종류별로 등록한다. 모든 enum 값의 등록은 필수다. */
export const notificationDefinitions: NotificationDefinitions = {
  [NotificationType.REVIEW_REACTION]: {
    messageKey: "review_reaction",
    system: false,
    params: (metadata, actorName) => ({
      actorName,
      bookTitle: metadata.bookTitle || "",
    }),
    link: reviewLink,
  },
  [NotificationType.REVIEW_COMMENT]: {
    messageKey: "review_comment",
    system: false,
    params: (metadata, actorName) => ({
      actorName,
      bookTitle: metadata.bookTitle || "",
      commentContent: metadata.commentContent || "",
    }),
    link: reviewLink,
  },
  [NotificationType.COMMENT_LIKE]: {
    messageKey: "comment_like",
    system: false,
    params: actorParams,
    link: reviewLink,
  },
  [NotificationType.BUYER_SELECTED]: {
    messageKey: "buyer_selected",
    system: false,
    params: actorParams,
    link: (metadata) => {
      const target = orderTarget(metadata);
      return target ? PATHS.ORDER_PAYMENT(target) : PATHS.MY_PAGE_PURCHASES;
    },
  },
  [NotificationType.OTHER_BUYER_TRADING]: {
    messageKey: "other_buyer_trading",
    system: false,
    params: noParams,
    link: () => PATHS.LOUNGE,
  },
  [NotificationType.PAYMENT_COMPLETED]: {
    messageKey: "payment_completed",
    system: false,
    params: actorParams,
    link: (metadata) => orderLink(metadata, PATHS.MY_PAGE_SALES_ORDERS),
  },
  [NotificationType.PAYMENT_EXPIRED]: {
    messageKey: "payment_expired",
    system: false,
    params: noParams,
    link: (metadata) => orderLink(metadata, PATHS.MY_PAGE_PURCHASES),
  },
  [NotificationType.SHIPPING_STARTED]: {
    messageKey: "shipping_started",
    system: false,
    params: (metadata, actorName) => {
      const trackingInfo = [
        metadata.carrier || "",
        metadata.trackingNumber || "",
      ]
        .filter(Boolean)
        .join(" ");
      return {
        actorName,
        trackingInfo: trackingInfo ? `(${trackingInfo})` : "",
      };
    },
    link: (metadata) => orderLink(metadata, PATHS.MY_PAGE_PURCHASES),
  },
  [NotificationType.DELIVERY_COMPLETED]: {
    messageKey: "delivery_completed",
    system: false,
    params: noParams,
    link: (metadata) => orderLink(metadata, PATHS.MY_PAGE_PURCHASES),
  },
  [NotificationType.AUTO_CONFIRM_IMMINENT]: {
    messageKey: "auto_confirm_imminent",
    system: false,
    params: (metadata) => ({ hours: String(metadata.remainingHours || 24) }),
    link: (metadata) => orderLink(metadata, PATHS.MY_PAGE_PURCHASES),
  },
  [NotificationType.PURCHASE_CONFIRMED]: {
    messageKey: "purchase_confirmed",
    system: false,
    params: actorParams,
    link: (metadata) => orderLink(metadata, PATHS.MY_PAGE_PURCHASES),
  },
  [NotificationType.ORDER_CANCELLED]: {
    messageKey: "order_cancelled",
    system: false,
    params: (metadata, _actorName, fallbacks) => ({
      reason: metadata.reason || fallbacks.cancelReason,
    }),
    link: (metadata) => orderLink(metadata, PATHS.MY_PAGE_PURCHASES),
  },
  [NotificationType.SHIPPING_DEADLINE_IMMINENT]: {
    messageKey: "shipping_deadline_imminent",
    system: false,
    params: (metadata) => ({ hours: String(metadata.remainingHours || 24) }),
    link: (metadata) => orderLink(metadata, PATHS.MY_PAGE_SALES_ORDERS),
  },
  [NotificationType.TRADE_REVIEW_RECEIVED]: {
    messageKey: "trade_review_received",
    system: false,
    params: actorParams,
    link: () => PATHS.MY_REVIEWS,
  },
  [NotificationType.TRADE_RESERVED]: {
    messageKey: "trade_reserved",
    system: false,
    params: actorParams,
    link: (metadata) =>
      metadata.saleId
        ? PATHS.BOOK_SALES_DETAIL(metadata.saleId)
        : PATHS.MY_PAGE_TRADES,
  },
  [NotificationType.TRADE_COMPLETED]: {
    messageKey: "trade_completed",
    system: false,
    params: actorParams,
    // 완료 알림의 목적은 후기 유도이므로 거래 내역으로 보낸다.
    link: () => PATHS.MY_PAGE_TRADES,
  },
  [NotificationType.FEEDBACK_REPLIED]: {
    messageKey: "feedback_replied",
    system: true,
    params: noParams,
    link: () => PATHS.MY_PAGE_FEEDBACK,
  },
  // 내 독서기록 페이지에서 그날 상세를 연다
  [NotificationType.READING_LOG_KONG]: {
    messageKey: "reading_log_kong",
    system: false,
    params: (metadata, actorName) => ({
      actorName,
      bookTitle: metadata.bookTitle || "",
    }),
    link: (metadata) =>
      metadata.date
        ? readingLogHref({ date: parseCalendarDate(metadata.date) })
        : PATHS.READING_LOG,
  },
};

// 등록부의 mapped type이 각 type과 metadata의 상관관계를 보장한다.
export const getNotificationDefinition = <T extends NotificationType>(
  type: T,
): NotificationDefinition<T> | undefined =>
  Object.hasOwn(notificationDefinitions, type)
    ? notificationDefinitions[type]
    : undefined;
