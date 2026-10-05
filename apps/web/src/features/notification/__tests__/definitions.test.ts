import {
  FeedbackType,
  type Notification,
  NotificationType,
} from "@bookjeok/core";
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import en from "@/shared/i18n/messages/en.json";
import ko from "@/shared/i18n/messages/ko.json";

import {
  getNotificationLink,
  getNotificationMessageParams,
  isSystemNotification,
} from "../utils";
import { notificationDefinitions } from "../utils/definitions";

const base = {
  id: 1,
  recipientId: 1,
  actorId: 2,
  actor: { id: 2, nickname: "독자", profileImageUrl: null },
  isRead: false,
  createdAt: "2026-10-04T00:00:00.000Z",
};
const fallbacks = { actor: "사용자", cancelReason: "거래 취소" };

type Fixture<T extends NotificationType> = {
  notification: Notification<T>;
  key: string;
  params: Record<string, string>;
  link: string;
};

const cases: { [T in NotificationType]: Fixture<T> } = {
  REVIEW_REACTION: {
    notification: {
      ...base,
      type: NotificationType.REVIEW_REACTION,
      metadata: { reviewId: 10, bookTitle: "책" },
    },
    key: "review_reaction",
    params: { actorName: "독자", bookTitle: "책" },
    link: "/book/reviews/10",
  },
  REVIEW_COMMENT: {
    notification: {
      ...base,
      type: NotificationType.REVIEW_COMMENT,
      metadata: { reviewId: 10, bookTitle: "책", commentContent: "댓글" },
    },
    key: "review_comment",
    params: { actorName: "독자", bookTitle: "책", commentContent: "댓글" },
    link: "/book/reviews/10",
  },
  COMMENT_LIKE: {
    notification: {
      ...base,
      type: NotificationType.COMMENT_LIKE,
      metadata: { commentId: 11, reviewId: 10 },
    },
    key: "comment_like",
    params: { actorName: "독자" },
    link: "/book/reviews/10",
  },
  BUYER_SELECTED: {
    notification: {
      ...base,
      type: NotificationType.BUYER_SELECTED,
      metadata: {
        orderId: "uuid",
        orderNumber: "ORD-1",
        saleId: 12,
        amount: 1000,
      },
    },
    key: "buyer_selected",
    params: { actorName: "독자" },
    link: "/order/payment/ORD-1",
  },
  OTHER_BUYER_TRADING: {
    notification: {
      ...base,
      type: NotificationType.OTHER_BUYER_TRADING,
      metadata: {},
    },
    key: "other_buyer_trading",
    params: {},
    link: "/lounge",
  },
  PAYMENT_COMPLETED: {
    notification: {
      ...base,
      type: NotificationType.PAYMENT_COMPLETED,
      metadata: { orderId: "uuid", saleId: 12, amount: 1000 },
    },
    key: "payment_completed",
    params: { actorName: "독자" },
    link: "/order/uuid",
  },
  PAYMENT_EXPIRED: {
    notification: {
      ...base,
      type: NotificationType.PAYMENT_EXPIRED,
      metadata: { orderId: "uuid" },
    },
    key: "payment_expired",
    params: {},
    link: "/order/uuid",
  },
  SHIPPING_STARTED: {
    notification: {
      ...base,
      type: NotificationType.SHIPPING_STARTED,
      metadata: { orderId: "uuid", carrier: "택배사", trackingNumber: "123" },
    },
    key: "shipping_started",
    params: { actorName: "독자", trackingInfo: "(택배사 123)" },
    link: "/order/uuid",
  },
  DELIVERY_COMPLETED: {
    notification: {
      ...base,
      type: NotificationType.DELIVERY_COMPLETED,
      metadata: { orderId: "uuid" },
    },
    key: "delivery_completed",
    params: {},
    link: "/order/uuid",
  },
  AUTO_CONFIRM_IMMINENT: {
    notification: {
      ...base,
      type: NotificationType.AUTO_CONFIRM_IMMINENT,
      metadata: { orderId: "uuid", remainingHours: 12 },
    },
    key: "auto_confirm_imminent",
    params: { hours: "12" },
    link: "/order/uuid",
  },
  PURCHASE_CONFIRMED: {
    notification: {
      ...base,
      type: NotificationType.PURCHASE_CONFIRMED,
      metadata: { orderId: "uuid" },
    },
    key: "purchase_confirmed",
    params: { actorName: "독자" },
    link: "/order/uuid",
  },
  ORDER_CANCELLED: {
    notification: {
      ...base,
      type: NotificationType.ORDER_CANCELLED,
      metadata: { orderId: "uuid", reason: "변심" },
    },
    key: "order_cancelled",
    params: { reason: "변심" },
    link: "/order/uuid",
  },
  SHIPPING_DEADLINE_IMMINENT: {
    notification: {
      ...base,
      type: NotificationType.SHIPPING_DEADLINE_IMMINENT,
      metadata: { orderId: "uuid", remainingHours: 12 },
    },
    key: "shipping_deadline_imminent",
    params: { hours: "12" },
    link: "/order/uuid",
  },
  TRADE_REVIEW_RECEIVED: {
    notification: {
      ...base,
      type: NotificationType.TRADE_REVIEW_RECEIVED,
      metadata: { reviewId: 13 },
    },
    key: "trade_review_received",
    params: { actorName: "독자" },
    link: "/my-page/reviews",
  },
  TRADE_RESERVED: {
    notification: {
      ...base,
      type: NotificationType.TRADE_RESERVED,
      metadata: { saleId: 12 },
    },
    key: "trade_reserved",
    params: { actorName: "독자" },
    link: "/book/sales/12",
  },
  TRADE_COMPLETED: {
    notification: {
      ...base,
      type: NotificationType.TRADE_COMPLETED,
      metadata: { saleId: 12, completionId: 14 },
    },
    key: "trade_completed",
    params: { actorName: "독자" },
    link: "/my-page/trades",
  },
  FEEDBACK_REPLIED: {
    notification: {
      ...base,
      actorId: null,
      actor: undefined,
      type: NotificationType.FEEDBACK_REPLIED,
      metadata: { feedbackId: 15, feedbackType: FeedbackType.OTHER },
    },
    key: "feedback_replied",
    params: {},
    link: "/my-page/feedback",
  },
};

describe("알림 표현 등록부", () => {
  it("모든 core enum 값을 빠짐없이 등록하고 계약 예시를 가진다", () => {
    expect(Object.keys(notificationDefinitions)).toEqual(
      Object.values(NotificationType),
    );
    expect(Object.keys(cases)).toEqual(Object.values(NotificationType));
  });

  it.each(Object.values(cases))(
    "$key 문구·링크·시스템 표시를 유지한다",
    ({ notification, key, params, link }) => {
      expect(getNotificationMessageParams(notification, fallbacks)).toEqual({
        key,
        params,
      });
      expect(getNotificationLink(notification)).toBe(link);
      expect(isSystemNotification(notification)).toBe(
        notification.type === NotificationType.FEEDBACK_REPLIED,
      );
    },
  );

  it.each([
    ["ko", ko],
    ["en", en],
  ] as const)(
    "%s 번역과 모든 보간 인자가 등록부와 일치한다",
    (locale, messages) => {
      const t = createTranslator({
        locale,
        messages,
        namespace: "notification",
        onError: (error) => {
          throw error;
        },
      });
      for (const { notification } of Object.values(cases)) {
        const { key, params } = getNotificationMessageParams(
          notification,
          fallbacks,
        );
        const template =
          messages.notification[key as keyof typeof messages.notification];
        expect(typeof template).toBe("string");
        const placeholders = [...String(template).matchAll(/\{(\w+)\}/g)]
          .map((match) => match[1])
          .sort();
        expect(Object.keys(params).sort()).toEqual(placeholders);
        expect(t(key, params)).not.toContain("{");
      }
    },
  );

  it("댓글 대상 리뷰가 없으면 기존 # 링크를 유지한다", () => {
    expect(
      getNotificationLink({
        ...cases.COMMENT_LIKE.notification,
        metadata: { commentId: 11, reviewId: null },
      }),
    ).toBe("#");
  });

  it("삭제된 행위자는 기존 대체 이름을 사용한다", () => {
    expect(
      getNotificationMessageParams(
        {
          ...cases.REVIEW_REACTION.notification,
          actor: undefined,
          actorId: null,
        },
        fallbacks,
      ).params.actorName,
    ).toBe("사용자");
  });

  it("운송장 미입력·취소 사유 빈 문자열·0시간은 기존 대체 문구를 유지한다", () => {
    expect(
      getNotificationMessageParams(
        {
          ...cases.SHIPPING_STARTED.notification,
          metadata: { orderId: "uuid", carrier: null },
        },
        fallbacks,
      ).params.trackingInfo,
    ).toBe("");
    expect(
      getNotificationMessageParams(
        {
          ...cases.ORDER_CANCELLED.notification,
          metadata: { orderId: "uuid", reason: "" },
        },
        fallbacks,
      ).params.reason,
    ).toBe("거래 취소");
    expect(
      getNotificationMessageParams(
        {
          ...cases.AUTO_CONFIRM_IMMINENT.notification,
          metadata: { orderId: "uuid", remainingHours: 0 },
        },
        fallbacks,
      ).params.hours,
    ).toBe("24");
  });

  it("예전의 불완전한 metadata와 미래의 미지원 타입도 기존 대체 표시를 유지한다", () => {
    const legacy = (type: NotificationType): Notification =>
      ({ ...base, type, metadata: {} }) as Notification;
    expect(getNotificationLink(legacy(NotificationType.REVIEW_REACTION))).toBe(
      "#",
    );
    expect(getNotificationLink(legacy(NotificationType.BUYER_SELECTED))).toBe(
      "/my-page/purchases",
    );
    expect(
      getNotificationLink(legacy(NotificationType.PAYMENT_COMPLETED)),
    ).toBe("/my-page/sales-orders");
    expect(
      getNotificationLink(legacy(NotificationType.SHIPPING_DEADLINE_IMMINENT)),
    ).toBe("/my-page/sales-orders");
    for (const type of [
      NotificationType.SHIPPING_STARTED,
      NotificationType.DELIVERY_COMPLETED,
      NotificationType.AUTO_CONFIRM_IMMINENT,
      NotificationType.PURCHASE_CONFIRMED,
      NotificationType.ORDER_CANCELLED,
      NotificationType.PAYMENT_EXPIRED,
    ]) {
      expect(getNotificationLink(legacy(type))).toBe("/my-page/purchases");
    }
    expect(getNotificationLink(legacy(NotificationType.TRADE_RESERVED))).toBe(
      "/my-page/trades",
    );
    for (const type of ["FUTURE_TYPE", "constructor", "__proto__"]) {
      const unknown = {
        ...base,
        type,
        metadata: {},
      } as unknown as Notification;
      expect(getNotificationMessageParams(unknown, fallbacks)).toEqual({
        key: "default",
        params: {},
      });
      expect(getNotificationLink(unknown)).toBe("#");
      expect(isSystemNotification(unknown)).toBe(false);
    }
  });
});
