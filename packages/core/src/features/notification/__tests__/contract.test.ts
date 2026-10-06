import { describe, expect, expectTypeOf, it } from "vitest";

import { FeedbackType } from "../../feedback/types";
import {
  type CreateNotificationArgs,
  type Notification,
  type NotificationMetadata,
  NotificationType,
} from "../types";

// 각 종류의 유효한 최소 입력. 새 타입·필수 필드는 이 표도 갱신해야 한다.
const metadata: { [T in NotificationType]: NotificationMetadata<T> } = {
  [NotificationType.REVIEW_REACTION]: { reviewId: 1, bookTitle: "책" },
  [NotificationType.REVIEW_COMMENT]: {
    reviewId: 1,
    bookTitle: "책",
    commentContent: "댓글",
  },
  [NotificationType.COMMENT_LIKE]: { commentId: 2, reviewId: null },
  [NotificationType.BUYER_SELECTED]: {
    orderId: "uuid",
    saleId: 3,
    amount: 1000,
  },
  [NotificationType.OTHER_BUYER_TRADING]: {},
  [NotificationType.PAYMENT_COMPLETED]: {
    orderId: "uuid",
    saleId: 3,
    amount: 1000,
  },
  [NotificationType.PAYMENT_EXPIRED]: { orderId: "uuid" },
  [NotificationType.SHIPPING_STARTED]: { orderId: "uuid" },
  [NotificationType.DELIVERY_COMPLETED]: { orderId: "uuid" },
  [NotificationType.AUTO_CONFIRM_IMMINENT]: {
    orderId: "uuid",
    remainingHours: 24,
  },
  [NotificationType.PURCHASE_CONFIRMED]: { orderId: "uuid" },
  [NotificationType.ORDER_CANCELLED]: { orderId: "uuid", reason: "취소" },
  [NotificationType.SHIPPING_DEADLINE_IMMINENT]: {
    orderId: "uuid",
    remainingHours: 24,
  },
  [NotificationType.TRADE_REVIEW_RECEIVED]: { reviewId: 4 },
  [NotificationType.TRADE_RESERVED]: { saleId: 3 },
  [NotificationType.TRADE_COMPLETED]: { saleId: 3, completionId: 5 },
  [NotificationType.FEEDBACK_REPLIED]: {
    feedbackId: 6,
    feedbackType: FeedbackType.OTHER,
  },
  [NotificationType.READING_LOG_KONG]: {
    readingLogId: "uuid",
    date: "2026-10-07",
    bookTitle: "책",
  },
};

// tsc로 검증하는 음성 계약. 실행하지 않아 저장/전송 부수 효과가 없다.
function checkTypes(type: NotificationType, notification: Notification) {
  const accept = (...args: CreateNotificationArgs) => args;
  // @ts-expect-error 리뷰 반응은 bookTitle 필수
  accept(NotificationType.REVIEW_REACTION, { reviewId: 1 });
  // @ts-expect-error 리뷰 댓글은 commentContent 필수
  accept(NotificationType.REVIEW_COMMENT, { reviewId: 1, bookTitle: "책" });
  // @ts-expect-error 댓글 좋아요는 nullable reviewId도 명시해야 한다
  accept(NotificationType.COMMENT_LIKE, { commentId: 2 });
  // @ts-expect-error 주문 선택은 amount 필수
  accept(NotificationType.BUYER_SELECTED, { orderId: "uuid", saleId: 3 });
  // @ts-expect-error 결제 완료는 saleId 필수
  accept(NotificationType.PAYMENT_COMPLETED, { orderId: "uuid", amount: 1000 });
  // @ts-expect-error 결제 만료는 orderId 필수
  accept(NotificationType.PAYMENT_EXPIRED, {});
  // @ts-expect-error 배송 시작은 orderId 필수
  accept(NotificationType.SHIPPING_STARTED, {});
  // @ts-expect-error 배송 완료는 orderId 필수
  accept(NotificationType.DELIVERY_COMPLETED, {});
  // @ts-expect-error 자동 확정 경고는 remainingHours 필수
  accept(NotificationType.AUTO_CONFIRM_IMMINENT, { orderId: "uuid" });
  // @ts-expect-error 구매 확정은 orderId 필수
  accept(NotificationType.PURCHASE_CONFIRMED, {});
  // @ts-expect-error 주문 취소는 reason 필수
  accept(NotificationType.ORDER_CANCELLED, { orderId: "uuid" });
  // @ts-expect-error 배송 경고는 remainingHours 필수
  accept(NotificationType.SHIPPING_DEADLINE_IMMINENT, { orderId: "uuid" });
  // @ts-expect-error 거래 후기는 reviewId 필수
  accept(NotificationType.TRADE_REVIEW_RECEIVED, {});
  // @ts-expect-error 예약은 saleId 필수
  accept(NotificationType.TRADE_RESERVED, {});
  // @ts-expect-error 완료는 completionId 필수
  accept(NotificationType.TRADE_COMPLETED, { saleId: 3 });
  // @ts-expect-error 문의 답변은 feedbackType 필수
  accept(NotificationType.FEEDBACK_REPLIED, { feedbackId: 6 });
  // @ts-expect-error 콩은 그날 상세로 가는 date 필수
  accept(NotificationType.READING_LOG_KONG, {
    readingLogId: "uuid",
    bookTitle: "책",
  });
  // @ts-expect-error 열린 타입 변수와 특정 metadata의 조합은 안전하지 않다
  accept(type, { saleId: 3 });
  const reserved = metadata[NotificationType.TRADE_RESERVED];
  // @ts-expect-error 다른 종류의 payload를 넣을 수 없다
  accept(NotificationType.REVIEW_REACTION, reserved);
  // @ts-expect-error 필드 타입 오류
  accept(NotificationType.TRADE_RESERVED, { saleId: "3" });
  if (notification.type === NotificationType.REVIEW_COMMENT) {
    expectTypeOf(notification.metadata.commentContent).toEqualTypeOf<string>();
    // @ts-expect-error 리뷰 댓글에는 completionId가 없다
    notification.metadata.completionId;
  }
}
void checkTypes;

describe("알림 계약", () => {
  it("현재 18종 enum의 이름·DB 값과 순서를 유지한다", () => {
    expect(Object.values(NotificationType)).toEqual([
      "REVIEW_REACTION",
      "REVIEW_COMMENT",
      "COMMENT_LIKE",
      "BUYER_SELECTED",
      "OTHER_BUYER_TRADING",
      "PAYMENT_COMPLETED",
      "PAYMENT_EXPIRED",
      "SHIPPING_STARTED",
      "DELIVERY_COMPLETED",
      "AUTO_CONFIRM_IMMINENT",
      "PURCHASE_CONFIRMED",
      "ORDER_CANCELLED",
      "SHIPPING_DEADLINE_IMMINENT",
      "TRADE_REVIEW_RECEIVED",
      "TRADE_RESERVED",
      "TRADE_COMPLETED",
      "FEEDBACK_REPLIED",
      "READING_LOG_KONG",
    ]);
    expect(Object.keys(metadata)).toEqual(Object.values(NotificationType));
  });
});
