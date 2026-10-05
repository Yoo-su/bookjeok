import { defineDomainEvent } from '@/shared/events/domain-event';

export interface TradeReviewCreatedEvent {
  reviewId: number;
  completionId: number;
  targetUserId: number;
  reviewerId: number;
  /** 현재 직거래 발행자는 이 필드를 보내지 않는다. */
  orderId?: string;
}

export const tradeReviewCreatedEvent =
  defineDomainEvent<TradeReviewCreatedEvent>()('trade_review.created');
