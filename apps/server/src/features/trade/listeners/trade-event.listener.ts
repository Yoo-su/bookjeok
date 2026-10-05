import { NotificationType } from '@bookjeok/core';
import { Injectable, Logger } from '@nestjs/common';

import { ChatMessageType } from '@/features/chat/entities/chat-message.entity';
import { ChatService } from '@/features/chat/services/chat.service';
import { NotificationService } from '@/features/notification/services/notification.service';
import {
  TradeCompletedEvent,
  TradeEvents,
  TradeReservationCancelledEvent,
  TradeReservedEvent,
  TradeSaleSoldEvent,
} from '@/features/trade/events/trade.events';
import { OnDomainEvent } from '@/shared/events/domain-event';

/**
 * 직거래 예약·완료에 따르는 알림과 채팅 시스템 메시지.
 *
 * 결제 흐름의 `OrderEventListener`와 같은 역할을 결제 없는 거래에 대해 합니다.
 */
@Injectable()
export class TradeEventListener {
  private readonly logger = new Logger(TradeEventListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * 판매자가 거래 상대를 지정했을 때
   */
  @OnDomainEvent(TradeEvents.reserved)
  async handleReserved(event: TradeReservedEvent) {
    try {
      await this.notificationService.createNotification(
        event.buyerId,
        event.sellerId,
        NotificationType.TRADE_RESERVED,
        { saleId: event.saleId },
      );

      if (event.chatRoomId) {
        await this.chatService.sendTradeMessage(
          event.chatRoomId,
          '판매자가 거래 상대로 지정했습니다. 채팅으로 거래 장소와 시간을 정해보세요.',
          ChatMessageType.TRADE_ACTION,
          { saleId: event.saleId, tradeStatus: 'RESERVED' },
        );
      }

      // 다른 구매희망자 채팅방에 거래 진행 중 안내
      await this.chatService.notifyOtherBuyersTrading(
        event.saleId,
        event.chatRoomId,
      );
    } catch (error) {
      this.logger.error(
        `trade.reserved 이벤트 처리 실패: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 판매자가 예약을 취소했을 때
   */
  @OnDomainEvent(TradeEvents.reservation_cancelled)
  async handleReservationCancelled(event: TradeReservationCancelledEvent) {
    try {
      if (!event.buyerId) return;

      await this.chatService.notifySaleBackOnMarket(event.saleId);
    } catch (error) {
      this.logger.error(
        `trade.reservation_cancelled 이벤트 처리 실패: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 판매글이 판매완료로 바뀌었을 때 (상대 지정 여부와 무관)
   *
   * 거래가 성사된 방에는 아래 `trade.completed`가 완료 안내를 보내므로,
   * 여기서는 나머지 방들만 챙깁니다.
   */
  @OnDomainEvent(TradeEvents.sale_sold)
  async handleSaleSold(event: TradeSaleSoldEvent) {
    try {
      await this.chatService.notifySaleSold(event.saleId, event.chatRoomId);
    } catch (error) {
      this.logger.error(
        `trade.sale_sold 이벤트 처리 실패: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 직거래가 완료됐을 때
   */
  @OnDomainEvent(TradeEvents.completed)
  async handleCompleted(event: TradeCompletedEvent) {
    try {
      await this.notificationService.createNotification(
        event.buyerId,
        event.sellerId,
        NotificationType.TRADE_COMPLETED,
        { saleId: event.saleId, completionId: event.completionId },
      );

      if (event.chatRoomId) {
        await this.chatService.sendTradeMessage(
          event.chatRoomId,
          '거래가 완료되었습니다. 서로에게 거래 후기를 남겨보세요.',
          ChatMessageType.TRADE_ACTION,
          {
            saleId: event.saleId,
            completionId: event.completionId,
            tradeStatus: 'COMPLETED',
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `trade.completed 이벤트 처리 실패: ${(error as Error).message}`,
      );
    }
  }
}
