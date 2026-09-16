import { Notification, NotificationType } from "@bookjeok/core";

import { PATHS } from "@/shared/constants/paths";

export const getNotificationMessageParams = (
  notification: Notification,
  fallbacks: { actor: string; cancelReason: string },
): { key: string; params: Record<string, string> } => {
  const { type, actor, metadata } = notification;
  const actorName = actor?.nickname ?? fallbacks.actor;

  switch (type) {
    case NotificationType.REVIEW_REACTION:
      return {
        key: "review_reaction",
        params: {
          actorName,
          bookTitle: (metadata.bookTitle as string) || "",
        },
      };
    case NotificationType.REVIEW_COMMENT:
      return {
        key: "review_comment",
        params: {
          actorName,
          bookTitle: (metadata.bookTitle as string) || "",
          commentContent: (metadata.commentContent as string) || "",
        },
      };
    case NotificationType.COMMENT_LIKE:
      return {
        key: "comment_like",
        params: {
          actorName,
        },
      };
    case NotificationType.BUYER_SELECTED:
      return {
        key: "buyer_selected",
        params: {
          actorName,
        },
      };
    case NotificationType.OTHER_BUYER_TRADING:
      return {
        key: "other_buyer_trading",
        params: {},
      };
    case NotificationType.PAYMENT_COMPLETED:
      return {
        key: "payment_completed",
        params: {
          actorName,
        },
      };
    case NotificationType.PAYMENT_EXPIRED:
      return {
        key: "payment_expired",
        params: {},
      };
    case NotificationType.SHIPPING_STARTED: {
      const carrier = (metadata.carrier as string) || "";
      const trackingNumber = (metadata.trackingNumber as string) || "";
      const trackingInfo = [carrier, trackingNumber].filter(Boolean).join(" ");
      return {
        key: "shipping_started",
        params: {
          actorName,
          trackingInfo: trackingInfo ? `(${trackingInfo})` : "",
        },
      };
    }
    case NotificationType.DELIVERY_COMPLETED:
      return {
        key: "delivery_completed",
        params: {},
      };
    case NotificationType.AUTO_CONFIRM_IMMINENT:
      return {
        key: "auto_confirm_imminent",
        params: {
          hours: String(metadata.remainingHours || 24),
        },
      };
    case NotificationType.PURCHASE_CONFIRMED:
      return {
        key: "purchase_confirmed",
        params: {
          actorName,
        },
      };
    case NotificationType.ORDER_CANCELLED:
      return {
        key: "order_cancelled",
        params: {
          reason: (metadata.reason as string) || fallbacks.cancelReason,
        },
      };
    case NotificationType.SHIPPING_DEADLINE_IMMINENT:
      return {
        key: "shipping_deadline_imminent",
        params: {
          hours: String(metadata.remainingHours || 24),
        },
      };
    case NotificationType.TRADE_REVIEW_RECEIVED:
      return {
        key: "trade_review_received",
        params: {
          actorName,
        },
      };
    case NotificationType.TRADE_RESERVED:
      return {
        key: "trade_reserved",
        params: {
          actorName,
        },
      };
    case NotificationType.TRADE_COMPLETED:
      return {
        key: "trade_completed",
        params: {
          actorName,
        },
      };
    default:
      return {
        key: "default",
        params: {},
      };
  }
};

export const getNotificationLink = (notification: Notification): string => {
  const { type, metadata } = notification;
  const orderTarget =
    (metadata.orderNumber as string) ||
    (metadata.orderId ? String(metadata.orderId) : null);

  switch (type) {
    case NotificationType.REVIEW_REACTION:
    case NotificationType.REVIEW_COMMENT:
    case NotificationType.COMMENT_LIKE:
      return metadata.reviewId
        ? PATHS.REVIEW_DETAIL(metadata.reviewId as number)
        : "#";
    case NotificationType.BUYER_SELECTED:
      return orderTarget
        ? PATHS.ORDER_PAYMENT(orderTarget)
        : PATHS.MY_PAGE_PURCHASES;
    case NotificationType.PAYMENT_COMPLETED:
    case NotificationType.SHIPPING_DEADLINE_IMMINENT:
      return orderTarget
        ? PATHS.ORDER_DETAIL(orderTarget)
        : PATHS.MY_PAGE_SALES_ORDERS;
    case NotificationType.SHIPPING_STARTED:
    case NotificationType.DELIVERY_COMPLETED:
    case NotificationType.AUTO_CONFIRM_IMMINENT:
    case NotificationType.PURCHASE_CONFIRMED:
    case NotificationType.ORDER_CANCELLED:
    case NotificationType.PAYMENT_EXPIRED:
      return orderTarget
        ? PATHS.ORDER_DETAIL(orderTarget)
        : PATHS.MY_PAGE_PURCHASES;
    case NotificationType.TRADE_REVIEW_RECEIVED:
      return PATHS.MY_REVIEWS;
    case NotificationType.TRADE_RESERVED:
      return metadata.saleId
        ? PATHS.BOOK_SALES_DETAIL(metadata.saleId as number)
        : PATHS.MY_PAGE_TRADES;
    // 완료 알림의 목적은 후기 유도이므로 거래 내역으로 보낸다.
    case NotificationType.TRADE_COMPLETED:
      return PATHS.MY_PAGE_TRADES;
    case NotificationType.OTHER_BUYER_TRADING:
      return PATHS.LOUNGE;
    default:
      return "#";
  }
};
