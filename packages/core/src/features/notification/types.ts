import type { FeedbackType } from "../feedback/types";

export enum NotificationType {
  REVIEW_REACTION = "REVIEW_REACTION",
  REVIEW_COMMENT = "REVIEW_COMMENT",
  COMMENT_LIKE = "COMMENT_LIKE",
  // 중고거래 관련 알림
  BUYER_SELECTED = "BUYER_SELECTED",
  OTHER_BUYER_TRADING = "OTHER_BUYER_TRADING",
  PAYMENT_COMPLETED = "PAYMENT_COMPLETED",
  PAYMENT_EXPIRED = "PAYMENT_EXPIRED",
  SHIPPING_STARTED = "SHIPPING_STARTED",
  DELIVERY_COMPLETED = "DELIVERY_COMPLETED",
  AUTO_CONFIRM_IMMINENT = "AUTO_CONFIRM_IMMINENT",
  PURCHASE_CONFIRMED = "PURCHASE_CONFIRMED",
  ORDER_CANCELLED = "ORDER_CANCELLED",
  SHIPPING_DEADLINE_IMMINENT = "SHIPPING_DEADLINE_IMMINENT",
  TRADE_REVIEW_RECEIVED = "TRADE_REVIEW_RECEIVED",
  // 직거래 (결제 없이 진행되는 거래)
  TRADE_RESERVED = "TRADE_RESERVED",
  TRADE_COMPLETED = "TRADE_COMPLETED",
  // 북적이 보내는 알림 (행위자 없음)
  FEEDBACK_REPLIED = "FEEDBACK_REPLIED",
}

export interface NotificationUser {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
}

/** 종류별 생성 계약. 새 enum 값은 여기에 metadata 정의도 필요하다. */
export interface NotificationMetadataMap {
  [NotificationType.REVIEW_REACTION]: { reviewId: number; bookTitle: string };
  [NotificationType.REVIEW_COMMENT]: {
    reviewId: number;
    bookTitle: string;
    commentContent: string;
  };
  // 리뷰 이외의 댓글은 이동할 리뷰가 없다.
  [NotificationType.COMMENT_LIKE]: {
    commentId: number;
    reviewId: number | null;
  };
  [NotificationType.BUYER_SELECTED]: OrderNotificationMetadata & {
    saleId: number;
    amount: number;
  };
  // 현재 생성 호출은 없고, 문구·라운지 링크에 metadata가 필요하지 않다.
  [NotificationType.OTHER_BUYER_TRADING]: Record<string, never>;
  [NotificationType.PAYMENT_COMPLETED]: OrderNotificationMetadata & {
    saleId: number;
    amount: number;
  };
  [NotificationType.PAYMENT_EXPIRED]: OrderNotificationMetadata;
  [NotificationType.SHIPPING_STARTED]: OrderNotificationMetadata & {
    carrier?: string | null;
    trackingNumber?: string | null;
  };
  [NotificationType.DELIVERY_COMPLETED]: OrderNotificationMetadata;
  [NotificationType.AUTO_CONFIRM_IMMINENT]: OrderNotificationMetadata & {
    remainingHours: number;
  };
  [NotificationType.PURCHASE_CONFIRMED]: OrderNotificationMetadata;
  [NotificationType.ORDER_CANCELLED]: OrderNotificationMetadata & {
    reason: string;
  };
  [NotificationType.SHIPPING_DEADLINE_IMMINENT]: OrderNotificationMetadata & {
    remainingHours: number;
  };
  // 직거래 후기도 같은 알림을 사용하므로 orderId는 선택이다.
  [NotificationType.TRADE_REVIEW_RECEIVED]: {
    reviewId: number;
    orderId?: string;
  };
  [NotificationType.TRADE_RESERVED]: { saleId: number };
  [NotificationType.TRADE_COMPLETED]: { saleId: number; completionId: number };
  [NotificationType.FEEDBACK_REPLIED]: {
    feedbackId: number;
    feedbackType: FeedbackType;
    bookTitle?: string;
  };
}

interface OrderNotificationMetadata {
  orderId: string;
  /** 기존 알림은 orderId만 갖고, 공개 주문번호가 있으면 링크에 우선 사용한다. */
  orderNumber?: string;
}

export type NotificationMetadata<
  T extends NotificationType = NotificationType,
> = NotificationMetadataMap[T];

/** tuple union으로 type이 union 변수여도 다른 종류의 metadata를 받지 않는다. */
export type CreateNotificationArgs = {
  [T in NotificationType]: [type: T, metadata: NotificationMetadata<T>];
}[NotificationType];

export type NotificationFilterArgs = {
  [T in NotificationType]: [
    type: T,
    metadata: Partial<NotificationMetadata<T>>,
  ];
}[NotificationType];

interface NotificationBase {
  id: number;
  recipientId: number;
  actorId: number | null;
  actor?: NotificationUser;
  isRead: boolean;
  createdAt: string;
}

/** type을 좁히면 해당 종류의 metadata도 함께 좁혀지는 응답 계약. */
export type Notification<T extends NotificationType = NotificationType> = {
  [K in T]: NotificationBase & { type: K; metadata: NotificationMetadata<K> };
}[T];

export interface NotificationResponse {
  items: Notification[];
  nextCursor: number | null;
}

export interface GetNotificationsParams {
  cursor?: number;
  limit?: number;
}
