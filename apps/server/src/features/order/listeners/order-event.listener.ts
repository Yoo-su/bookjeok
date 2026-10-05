import { NotificationType } from '@bookjeok/core';
import { Injectable, Logger } from '@nestjs/common';

import { ChatMessageType } from '@/features/chat/entities/chat-message.entity';
import { ChatService } from '@/features/chat/services/chat.service';
import { NotificationService } from '@/features/notification/services/notification.service';
import {
  OrderAutoConfirmWarningEvent,
  OrderBuyerSelectedEvent,
  OrderCancelledEvent,
  OrderConfirmedEvent,
  OrderDeliveryCompletedEvent,
  OrderDisputedEvent,
  OrderEvents,
  OrderExpiredEvent,
  OrderPaymentCompletedEvent,
  OrderShippingDeadlineWarningEvent,
  OrderShippingStartedEvent,
} from '@/features/order/events/order.events';
import {
  TradeReviewCreatedEvent,
  tradeReviewCreatedEvent,
} from '@/features/trade/events/trade-review-created.event';
import { OnDomainEvent } from '@/shared/events/domain-event';

import { OrderStatus } from '../entities/order.entity';

@Injectable()
export class OrderEventListener {
  private readonly logger = new Logger(OrderEventListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * 판매자가 구매자를 거래 상대로 선택했을 때
   */
  @OnDomainEvent(OrderEvents.buyer_selected)
  async handleBuyerSelected(event: OrderBuyerSelectedEvent) {
    try {
      // 1. 구매자에게 알림 발송
      await this.notificationService.createNotification(
        event.buyerId,
        event.sellerId,
        NotificationType.BUYER_SELECTED,
        {
          orderId: event.orderId,
          saleId: event.saleId,
          amount: event.amount,
        },
      );

      // 2. 해당 채팅방에 결제 요청 시스템 메시지 전송
      if (event.chatRoomId) {
        await this.chatService.sendTradeMessage(
          event.chatRoomId,
          '판매자가 거래 상대로 선택했습니다. 결제를 진행해주세요.',
          ChatMessageType.TRADE_ACTION,
          {
            orderId: event.orderId,
            status: OrderStatus.AWAITING_PAYMENT,
            amount: event.amount,
          },
        );
      }

      // 3. 타 구매희망자 채팅방들에 거래진행 알림
      await this.chatService.notifyOtherBuyersTrading(
        event.saleId,
        event.chatRoomId,
      );
    } catch (error) {
      this.logger.error(
        `order.buyer_selected 이벤트 처리 실패: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 구매자가 결제를 완료했을 때
   */
  @OnDomainEvent(OrderEvents.payment_completed)
  async handlePaymentCompleted(event: OrderPaymentCompletedEvent) {
    try {
      // 1. 판매자에게 결제 완료 알림 발송
      await this.notificationService.createNotification(
        event.sellerId,
        event.buyerId,
        NotificationType.PAYMENT_COMPLETED,
        {
          orderId: event.orderId,
          saleId: event.saleId,
          amount: event.amount,
        },
      );

      // 2. 채팅방에 배송 요청 시스템 메시지 전송
      if (event.chatRoomId) {
        await this.chatService.sendTradeMessage(
          event.chatRoomId,
          '구매자가 결제를 완료했습니다. 상품을 발송하고 운송장을 등록해주세요.',
          ChatMessageType.TRADE_ACTION,
          {
            orderId: event.orderId,
            status: OrderStatus.PAID,
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `order.payment_completed 이벤트 처리 실패: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 판매자가 운송장을 등록하여 배송을 시작했을 때
   */
  @OnDomainEvent(OrderEvents.shipping_started)
  async handleShippingStarted(event: OrderShippingStartedEvent) {
    try {
      // 1. 구매자에게 배송 시작 알림 발송
      await this.notificationService.createNotification(
        event.buyerId,
        event.sellerId,
        NotificationType.SHIPPING_STARTED,
        {
          orderId: event.orderId,
          carrier: event.carrier,
          trackingNumber: event.trackingNumber,
        },
      );

      // 2. 채팅방에 운송장 안내 메시지 전송
      if (event.chatRoomId) {
        const carrierInfo =
          event.carrier && event.trackingNumber
            ? ` (${event.carrier} ${event.trackingNumber})`
            : '';
        await this.chatService.sendTradeMessage(
          event.chatRoomId,
          `판매자가 상품을 발송했습니다.${carrierInfo}`,
          ChatMessageType.TRADE_STATUS,
          {
            orderId: event.orderId,
            status: OrderStatus.SHIPPED,
            carrier: event.carrier,
            trackingNumber: event.trackingNumber,
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `order.shipping_started 이벤트 처리 실패: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 배송 완료가 감지/기록되었을 때
   */
  @OnDomainEvent(OrderEvents.delivery_completed)
  async handleDeliveryCompleted(event: OrderDeliveryCompletedEvent) {
    try {
      // 1. 구매자에게 배송 완료 알림 발송
      await this.notificationService.createNotification(
        event.buyerId,
        event.sellerId,
        NotificationType.DELIVERY_COMPLETED,
        {
          orderId: event.orderId,
        },
      );

      // 2. 채팅방에 구매확정 요청 메시지 전송
      if (event.chatRoomId) {
        await this.chatService.sendTradeMessage(
          event.chatRoomId,
          '배송이 완료되었습니다. 물품 상태 확인 후 구매확정을 진행해주세요.',
          ChatMessageType.TRADE_ACTION,
          {
            orderId: event.orderId,
            status: OrderStatus.DELIVERED,
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `order.delivery_completed 이벤트 처리 실패: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 구매자가 구매를 확정했거나 자동 구매확정되었을 때
   */
  @OnDomainEvent(OrderEvents.confirmed)
  @OnDomainEvent(OrderEvents.auto_confirmed)
  async handlePurchaseConfirmed(event: OrderConfirmedEvent) {
    try {
      // 1. 판매자에게 구매확정 완료 알림 발송
      await this.notificationService.createNotification(
        event.sellerId,
        event.buyerId,
        NotificationType.PURCHASE_CONFIRMED,
        {
          orderId: event.orderId,
        },
      );

      // 2. 채팅방에 거래 완료 메시지 전송
      if (event.chatRoomId) {
        await this.chatService.sendTradeMessage(
          event.chatRoomId,
          '구매가 확정되었습니다. 거래가 성공적으로 완료되었습니다.',
          ChatMessageType.TRADE_STATUS,
          {
            orderId: event.orderId,
            status: OrderStatus.CONFIRMED,
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `order.confirmed 이벤트 처리 실패: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 구매자가 구매확정을 거부하고 분쟁을 제기했을 때
   */
  @OnDomainEvent(OrderEvents.disputed)
  async handleOrderDisputed(event: OrderDisputedEvent) {
    try {
      if (event.chatRoomId) {
        const reasonText = event.disputeReason
          ? ` (사유: ${event.disputeReason})`
          : '';
        await this.chatService.sendTradeMessage(
          event.chatRoomId,
          `구매자가 구매확정을 거부하고 분쟁을 제기했습니다.${reasonText}`,
          ChatMessageType.TRADE_STATUS,
          {
            orderId: event.orderId,
            status: OrderStatus.DISPUTED,
            disputeReason: event.disputeReason,
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `order.disputed 이벤트 처리 실패: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 주문이 취소되었을 때 (사용자 취소, 만료, 미배송 자동환불, 분쟁 자동환불)
   */
  @OnDomainEvent(OrderEvents.cancelled)
  @OnDomainEvent(OrderEvents.unshipped_cancelled)
  @OnDomainEvent(OrderEvents.dispute_expired_refunded)
  async handleOrderCancelled(event: OrderCancelledEvent) {
    try {
      const reason = event.reason || '주문 취소';

      // 구매자 및 판매자 모두에게 취소 알림 발송
      await this.notificationService.createNotification(
        event.buyerId,
        event.sellerId,
        NotificationType.ORDER_CANCELLED,
        {
          orderId: event.orderId,
          reason,
        },
      );

      await this.notificationService.createNotification(
        event.sellerId,
        event.buyerId,
        NotificationType.ORDER_CANCELLED,
        {
          orderId: event.orderId,
          reason,
        },
      );

      // 채팅방에 취소 안내 메시지 전송
      if (event.chatRoomId) {
        await this.chatService.sendTradeMessage(
          event.chatRoomId,
          `주문이 취소되었습니다. (사유: ${reason})`,
          ChatMessageType.TRADE_STATUS,
          {
            orderId: event.orderId,
            status: OrderStatus.CANCELLED,
            reason,
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `order.cancelled 이벤트 처리 실패: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 24시간 미결제로 주문이 만료되었을 때
   */
  @OnDomainEvent(OrderEvents.expired)
  async handleOrderExpired(event: OrderExpiredEvent) {
    try {
      // 구매자와 판매자에게 결제 만료 알림 발송
      await this.notificationService.createNotification(
        event.buyerId,
        event.sellerId,
        NotificationType.PAYMENT_EXPIRED,
        {
          orderId: event.orderId,
        },
      );

      await this.notificationService.createNotification(
        event.sellerId,
        event.buyerId,
        NotificationType.PAYMENT_EXPIRED,
        {
          orderId: event.orderId,
        },
      );

      if (event.chatRoomId) {
        await this.chatService.sendTradeMessage(
          event.chatRoomId,
          '결제 기한(24시간)이 만료되어 주문이 자동 취소되었습니다.',
          ChatMessageType.TRADE_STATUS,
          {
            orderId: event.orderId,
            status: OrderStatus.CANCELLED,
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `order.expired 이벤트 처리 실패: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 자동구매확정 D-1 사전 경고 알림
   */
  @OnDomainEvent(OrderEvents.auto_confirm_warning)
  async handleAutoConfirmWarning(event: OrderAutoConfirmWarningEvent) {
    try {
      await this.notificationService.createNotification(
        event.buyerId,
        event.sellerId,
        NotificationType.AUTO_CONFIRM_IMMINENT,
        {
          orderId: event.orderId,
          remainingHours: event.remainingHours,
        },
      );
    } catch (error) {
      this.logger.error(
        `order.auto_confirm_warning 처리 실패: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 배송기한 D-1 사전 경고 알림
   */
  @OnDomainEvent(OrderEvents.shipping_deadline_warning)
  async handleShippingDeadlineWarning(
    event: OrderShippingDeadlineWarningEvent,
  ) {
    try {
      await this.notificationService.createNotification(
        event.sellerId,
        event.buyerId,
        NotificationType.SHIPPING_DEADLINE_IMMINENT,
        {
          orderId: event.orderId,
          remainingHours: event.remainingHours,
        },
      );
    } catch (error) {
      this.logger.error(
        `order.shipping_deadline_warning 처리 실패: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 거래 후기가 작성되었을 때
   */
  @OnDomainEvent(tradeReviewCreatedEvent)
  async handleTradeReviewCreated(event: TradeReviewCreatedEvent) {
    try {
      await this.notificationService.createNotification(
        event.targetUserId,
        event.reviewerId,
        NotificationType.TRADE_REVIEW_RECEIVED,
        {
          reviewId: event.reviewId,
          orderId: event.orderId,
        },
      );
    } catch (error) {
      this.logger.error(
        `trade_review.created 처리 실패: ${(error as Error).message}`,
      );
    }
  }
}
