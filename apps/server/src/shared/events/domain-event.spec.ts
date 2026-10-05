import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { EVENT_LISTENER_METADATA } from '@nestjs/event-emitter/dist/constants';
import { Test } from '@nestjs/testing';

import { chatRoomCreatedEvent } from '@/features/chat/events/chat-room-created.event';
import { ChatCleanupListener } from '@/features/chat/listeners/chat-cleanup.listener';
import { ChatMailListener } from '@/features/chat/listeners/chat-mail.listener';
import { CommentEvents } from '@/features/comment/events/comment.events';
import { CommentCleanupListener } from '@/features/comment/listeners/comment-cleanup.listener';
import { CommentNotificationListener } from '@/features/comment/listeners/comment-notification.listener';
import { FeedbackEvents } from '@/features/feedback/events/feedback.events';
import { FeedbackCleanupListener } from '@/features/feedback/listeners/feedback-cleanup.listener';
import { FeedbackNotifyListener } from '@/features/feedback/listeners/feedback-notify.listener';
import { FeedbackReplyNotifyListener } from '@/features/feedback/listeners/feedback-reply-notify.listener';
import { LlmCleanupListener } from '@/features/llm/listeners/llm-cleanup.listener';
import { NotificationCleanupListener } from '@/features/notification/listeners/notification-cleanup.listener';
import { OrderEvents } from '@/features/order/events/order.events';
import { OrderEventListener } from '@/features/order/listeners/order-event.listener';
import { ReadingLogCleanupListener } from '@/features/reading-log/listeners/reading-log-cleanup.listener';
import { ReviewEvents } from '@/features/review/events/review.events';
import { ReviewCleanupListener } from '@/features/review/listeners/review-cleanup.listener';
import { ReviewNotificationListener } from '@/features/review/listeners/review-notification.listener';
import { TradeEvents } from '@/features/trade/events/trade.events';
import { tradeReviewCreatedEvent } from '@/features/trade/events/trade-review-created.event';
import { TradeEventListener } from '@/features/trade/listeners/trade-event.listener';
import { UsedBookSaleCleanupListener } from '@/features/used-book-sale/listeners/used-book-sale-cleanup.listener';
import { userWithdrawnEvent } from '@/features/user/events/user-withdrawn.event';
import { UserCleanupListener } from '@/features/user/listeners/user-cleanup.listener';
import { activityLogCreatedEvent } from '@/shared/activity/events/activity-log-created.event';
import { ActivityCleanupListener } from '@/shared/activity/listeners/activity-cleanup.listener';
import { ActivityService } from '@/shared/activity/services/activity.service';
import {
  defineDomainEvent,
  emitDomainEvent,
  emitDomainEventAsync,
  OnDomainEvent,
} from '@/shared/events/domain-event';

const subscriptions = [
  [
    'ChatMailListener.handleChatRoomCreated',
    ChatMailListener.prototype,
    'handleChatRoomCreated',
    [{ event: 'chat.room_created', options: { async: true } }],
  ],
  [
    'CommentNotificationListener.handleCommentCreated',
    CommentNotificationListener.prototype,
    'handleCommentCreated',
    [{ event: 'comment.created', options: undefined }],
  ],
  [
    'CommentNotificationListener.handleCommentLiked',
    CommentNotificationListener.prototype,
    'handleCommentLiked',
    [{ event: 'comment.liked', options: undefined }],
  ],
  [
    'ReviewNotificationListener.handleReviewReacted',
    ReviewNotificationListener.prototype,
    'handleReviewReacted',
    [{ event: 'review.reacted', options: undefined }],
  ],
  [
    'FeedbackNotifyListener.handleFeedbackCreated',
    FeedbackNotifyListener.prototype,
    'handleFeedbackCreated',
    [{ event: 'feedback.created', options: { async: true } }],
  ],
  [
    'FeedbackReplyNotifyListener.handleFeedbackReplied',
    FeedbackReplyNotifyListener.prototype,
    'handleFeedbackReplied',
    [{ event: 'feedback.replied', options: { async: true } }],
  ],
  [
    'TradeEventListener.handleReserved',
    TradeEventListener.prototype,
    'handleReserved',
    [{ event: 'trade.reserved', options: undefined }],
  ],
  [
    'TradeEventListener.handleReservationCancelled',
    TradeEventListener.prototype,
    'handleReservationCancelled',
    [{ event: 'trade.reservation_cancelled', options: undefined }],
  ],
  [
    'TradeEventListener.handleSaleSold',
    TradeEventListener.prototype,
    'handleSaleSold',
    [{ event: 'trade.sale_sold', options: undefined }],
  ],
  [
    'TradeEventListener.handleCompleted',
    TradeEventListener.prototype,
    'handleCompleted',
    [{ event: 'trade.completed', options: undefined }],
  ],
  [
    'ActivityService.handleActivityCreatedEvent',
    ActivityService.prototype,
    'handleActivityCreatedEvent',
    [{ event: 'ACTIVITY_LOG.CREATED', options: { async: true } }],
  ],
  [
    'OrderEventListener.handleBuyerSelected',
    OrderEventListener.prototype,
    'handleBuyerSelected',
    [{ event: 'order.buyer_selected', options: undefined }],
  ],
  [
    'OrderEventListener.handlePaymentCompleted',
    OrderEventListener.prototype,
    'handlePaymentCompleted',
    [{ event: 'order.payment_completed', options: undefined }],
  ],
  [
    'OrderEventListener.handleShippingStarted',
    OrderEventListener.prototype,
    'handleShippingStarted',
    [{ event: 'order.shipping_started', options: undefined }],
  ],
  [
    'OrderEventListener.handleDeliveryCompleted',
    OrderEventListener.prototype,
    'handleDeliveryCompleted',
    [{ event: 'order.delivery_completed', options: undefined }],
  ],
  [
    'OrderEventListener.handlePurchaseConfirmed',
    OrderEventListener.prototype,
    'handlePurchaseConfirmed',
    [
      { event: 'order.auto_confirmed', options: undefined },
      { event: 'order.confirmed', options: undefined },
    ],
  ],
  [
    'OrderEventListener.handleOrderDisputed',
    OrderEventListener.prototype,
    'handleOrderDisputed',
    [{ event: 'order.disputed', options: undefined }],
  ],
  [
    'OrderEventListener.handleOrderCancelled',
    OrderEventListener.prototype,
    'handleOrderCancelled',
    [
      { event: 'order.dispute_expired_refunded', options: undefined },
      { event: 'order.unshipped_cancelled', options: undefined },
      { event: 'order.cancelled', options: undefined },
    ],
  ],
  [
    'OrderEventListener.handleOrderExpired',
    OrderEventListener.prototype,
    'handleOrderExpired',
    [{ event: 'order.expired', options: undefined }],
  ],
  [
    'OrderEventListener.handleAutoConfirmWarning',
    OrderEventListener.prototype,
    'handleAutoConfirmWarning',
    [{ event: 'order.auto_confirm_warning', options: undefined }],
  ],
  [
    'OrderEventListener.handleShippingDeadlineWarning',
    OrderEventListener.prototype,
    'handleShippingDeadlineWarning',
    [{ event: 'order.shipping_deadline_warning', options: undefined }],
  ],
  [
    'OrderEventListener.handleTradeReviewCreated',
    OrderEventListener.prototype,
    'handleTradeReviewCreated',
    [{ event: 'trade_review.created', options: undefined }],
  ],
  [
    'ChatCleanupListener.handleUserWithdrawn',
    ChatCleanupListener.prototype,
    'handleUserWithdrawn',
    [{ event: 'user.withdrawn', options: { suppressErrors: false } }],
  ],
  [
    'CommentCleanupListener.handleUserWithdrawn',
    CommentCleanupListener.prototype,
    'handleUserWithdrawn',
    [{ event: 'user.withdrawn', options: { suppressErrors: false } }],
  ],
  [
    'FeedbackCleanupListener.handleUserWithdrawn',
    FeedbackCleanupListener.prototype,
    'handleUserWithdrawn',
    [{ event: 'user.withdrawn', options: { suppressErrors: false } }],
  ],
  [
    'LlmCleanupListener.handleUserWithdrawn',
    LlmCleanupListener.prototype,
    'handleUserWithdrawn',
    [{ event: 'user.withdrawn', options: { suppressErrors: false } }],
  ],
  [
    'NotificationCleanupListener.handleUserWithdrawn',
    NotificationCleanupListener.prototype,
    'handleUserWithdrawn',
    [{ event: 'user.withdrawn', options: { suppressErrors: false } }],
  ],
  [
    'ReadingLogCleanupListener.handleUserWithdrawn',
    ReadingLogCleanupListener.prototype,
    'handleUserWithdrawn',
    [{ event: 'user.withdrawn', options: { suppressErrors: false } }],
  ],
  [
    'ReviewCleanupListener.handleUserWithdrawn',
    ReviewCleanupListener.prototype,
    'handleUserWithdrawn',
    [{ event: 'user.withdrawn', options: { suppressErrors: false } }],
  ],
  [
    'UsedBookSaleCleanupListener.handleUserWithdrawn',
    UsedBookSaleCleanupListener.prototype,
    'handleUserWithdrawn',
    [{ event: 'user.withdrawn', options: { suppressErrors: false } }],
  ],
  [
    'UserCleanupListener.handleUserWithdrawn',
    UserCleanupListener.prototype,
    'handleUserWithdrawn',
    [{ event: 'user.withdrawn', options: { suppressErrors: false } }],
  ],
  [
    'ActivityCleanupListener.handleUserWithdrawn',
    ActivityCleanupListener.prototype,
    'handleUserWithdrawn',
    [{ event: 'user.withdrawn', options: { suppressErrors: false } }],
  ],
] as const;

describe('도메인 이벤트 계약', () => {
  it('현재 이벤트 이름 26개를 유지한다', () => {
    const contracts = [
      chatRoomCreatedEvent,
      ...Object.values(CommentEvents),
      ...Object.values(FeedbackEvents),
      ...Object.values(OrderEvents),
      ...Object.values(ReviewEvents),
      ...Object.values(TradeEvents),
      tradeReviewCreatedEvent,
      userWithdrawnEvent,
      activityLogCreatedEvent,
    ];
    expect(contracts.map((contract) => contract.name).sort()).toEqual(
      [
        'ACTIVITY_LOG.CREATED',
        'chat.room_created',
        'comment.created',
        'comment.liked',
        'feedback.created',
        'feedback.replied',
        'order.auto_confirm_warning',
        'order.auto_confirmed',
        'order.buyer_selected',
        'order.cancelled',
        'order.confirmed',
        'order.delivery_completed',
        'order.dispute_expired_refunded',
        'order.disputed',
        'order.expired',
        'order.payment_completed',
        'order.shipping_deadline_warning',
        'order.shipping_started',
        'order.unshipped_cancelled',
        'review.reacted',
        'trade.completed',
        'trade.reservation_cancelled',
        'trade.reserved',
        'trade.sale_sold',
        'trade_review.created',
        'user.withdrawn',
      ].sort(),
    );
  });

  it.each(subscriptions)(
    '%s의 구독 이름과 Nest 옵션을 유지한다',
    (_name, prototype, method, expected) => {
      expect(
        Reflect.getMetadata(
          EVENT_LISTENER_METADATA,
          Reflect.get(prototype, method),
        ),
      ).toEqual(expected);
    },
  );

  it('emit은 같은 payload 객체를 즉시 전달하고 리스너 오류를 그대로 전파한다', () => {
    const emitter = new EventEmitter2();
    const payload = { saleId: 1, sellerId: 2, buyerId: null };
    const received: unknown[] = [];
    emitter.on(TradeEvents.reservation_cancelled.name, (event: unknown) =>
      received.push(event),
    );
    expect(
      emitDomainEvent(emitter, TradeEvents.reservation_cancelled, payload),
    ).toBe(true);
    expect(received[0]).toBe(payload);

    const failure = new Error('listener failed');
    emitter.on(TradeEvents.reservation_cancelled.name, () => {
      throw failure;
    });
    expect(() =>
      emitDomainEvent(emitter, TradeEvents.reservation_cancelled, payload),
    ).toThrow(failure);
  });

  it('Nest가 실제로 계약 이름을 구독하고 emitAsync의 실패를 전파한다', async () => {
    const event = defineDomainEvent<{ userId: number }>()('contract.test');
    const received: unknown[] = [];
    const failure = new Error('cleanup failed');
    class Listener {
      @OnDomainEvent(event, { suppressErrors: false })
      handle(payload: { userId: number }) {
        received.push(payload);
        throw failure;
      }
    }
    const module = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [Listener],
    }).compile();
    try {
      await module.init();
      const payload = { userId: 1 };
      await expect(
        emitDomainEventAsync(module.get(EventEmitter2), event, payload),
      ).rejects.toThrow(failure);
      expect(received[0]).toBe(payload);
    } finally {
      await module.close();
    }
  });
});
