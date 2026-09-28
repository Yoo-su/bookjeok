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

export interface NotificationMetadata {
  reviewId?: number;
  bookTitle?: string;
  reviewTitle?: string;
  commentContent?: string;
  commentId?: number;
  targetType?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: number;
  recipientId: number;
  actorId: number | null;
  actor?: NotificationUser;
  type: NotificationType;
  metadata: NotificationMetadata;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  items: Notification[];
  nextCursor: number | null;
}

export interface GetNotificationsParams {
  cursor?: number;
  limit?: number;
}
