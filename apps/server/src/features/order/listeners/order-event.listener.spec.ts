import { NotificationType } from '@bookjeok/core';
import { Test, TestingModule } from '@nestjs/testing';

import { ChatMessageType } from '@/features/chat/entities/chat-message.entity';
import { ChatService } from '@/features/chat/services/chat.service';
import { NotificationService } from '@/features/notification/services/notification.service';

import { OrderEventListener } from './order-event.listener';

describe('OrderEventListener', () => {
  let listener: OrderEventListener;
  let mockNotificationService: { createNotification: jest.Mock };
  let mockChatService: {
    sendTradeMessage: jest.Mock;
    notifyOtherBuyersTrading: jest.Mock;
  };

  beforeEach(async () => {
    mockNotificationService = {
      createNotification: jest.fn().mockResolvedValue({ id: 1 }),
    };
    mockChatService = {
      sendTradeMessage: jest.fn().mockResolvedValue({ id: 1 }),
      notifyOtherBuyersTrading: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderEventListener,
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    listener = module.get<OrderEventListener>(OrderEventListener);
  });

  describe('handleBuyerSelected', () => {
    it('구매자 선택 이벤트 수신 시 알림 생성, 채팅 메시지 전송, 타 구매자 알림을 실행한다', async () => {
      await listener.handleBuyerSelected({
        orderId: 'ORD-10',
        saleId: 100,
        buyerId: 2,
        sellerId: 1,
        amount: 15000,
        chatRoomId: 5,
      });

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        2,
        1,
        NotificationType.BUYER_SELECTED,
        expect.objectContaining({ orderId: 'ORD-10' }),
      );
      expect(mockChatService.sendTradeMessage).toHaveBeenCalledWith(
        5,
        expect.stringContaining('결제를 진행해주세요'),
        ChatMessageType.TRADE_ACTION,
        expect.objectContaining({ orderId: 'ORD-10', amount: 15000 }),
      );
      expect(mockChatService.notifyOtherBuyersTrading).toHaveBeenCalledWith(
        100,
        5,
      );
    });
  });

  describe('handlePaymentCompleted', () => {
    it('결제 완료 이벤트 수신 시 판매자에게 알림 및 채팅 메시지를 발송한다', async () => {
      await listener.handlePaymentCompleted({
        orderId: 'ORD-10',
        saleId: 100,
        buyerId: 2,
        sellerId: 1,
        amount: 15000,
        chatRoomId: 5,
      });

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        1,
        2,
        NotificationType.PAYMENT_COMPLETED,
        expect.objectContaining({ orderId: 'ORD-10', amount: 15000 }),
      );
      expect(mockChatService.sendTradeMessage).toHaveBeenCalledWith(
        5,
        expect.stringContaining('운송장을 등록해주세요'),
        ChatMessageType.TRADE_ACTION,
        expect.objectContaining({ orderId: 'ORD-10' }),
      );
    });
  });

  describe('handleShippingStarted', () => {
    it('배송 시작 이벤트 수신 시 구매자에게 알림 및 채팅 메시지를 발송한다', async () => {
      await listener.handleShippingStarted({
        orderId: 'ORD-10',
        saleId: 100,
        buyerId: 2,
        sellerId: 1,
        carrier: 'CJ대한통운',
        trackingNumber: '1234567890',
        chatRoomId: 5,
      });

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        2,
        1,
        NotificationType.SHIPPING_STARTED,
        expect.objectContaining({
          carrier: 'CJ대한통운',
          trackingNumber: '1234567890',
        }),
      );
      expect(mockChatService.sendTradeMessage).toHaveBeenCalledWith(
        5,
        expect.stringContaining('CJ대한통운 1234567890'),
        ChatMessageType.TRADE_STATUS,
        expect.objectContaining({ orderId: 'ORD-10' }),
      );
    });
  });

  describe('handleDeliveryCompleted', () => {
    it('배송 완료 이벤트 수신 시 구매자에게 알림 및 구매확정 요청 메시지를 발송한다', async () => {
      await listener.handleDeliveryCompleted({
        orderId: 'ORD-10',
        saleId: 100,
        buyerId: 2,
        sellerId: 1,
        chatRoomId: 5,
      });

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        2,
        1,
        NotificationType.DELIVERY_COMPLETED,
        expect.objectContaining({ orderId: 'ORD-10' }),
      );
      expect(mockChatService.sendTradeMessage).toHaveBeenCalledWith(
        5,
        expect.stringContaining('구매확정을 진행해주세요'),
        ChatMessageType.TRADE_ACTION,
        expect.objectContaining({ orderId: 'ORD-10' }),
      );
    });
  });

  describe('handlePurchaseConfirmed', () => {
    it('구매 확정 이벤트 수신 시 판매자에게 알림 및 거래 완료 메시지를 발송한다', async () => {
      await listener.handlePurchaseConfirmed({
        orderId: 'ORD-10',
        saleId: 100,
        buyerId: 2,
        sellerId: 1,
        chatRoomId: 5,
      });

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        1,
        2,
        NotificationType.PURCHASE_CONFIRMED,
        expect.objectContaining({ orderId: 'ORD-10' }),
      );
      expect(mockChatService.sendTradeMessage).toHaveBeenCalledWith(
        5,
        expect.stringContaining('구매가 확정되었습니다'),
        ChatMessageType.TRADE_STATUS,
        expect.objectContaining({ orderId: 'ORD-10' }),
      );
    });
  });

  describe('handleOrderDisputed', () => {
    it('분쟁 제기 이벤트 수신 시 채팅방에 분쟁 메시지를 발송한다', async () => {
      await listener.handleOrderDisputed({
        orderId: 'ORD-10',
        saleId: 100,
        buyerId: 2,
        sellerId: 1,
        chatRoomId: 5,
        disputeReason: '파손됨',
      });

      expect(mockChatService.sendTradeMessage).toHaveBeenCalledWith(
        5,
        expect.stringContaining('파손됨'),
        ChatMessageType.TRADE_STATUS,
        expect.objectContaining({ orderId: 'ORD-10', disputeReason: '파손됨' }),
      );
    });
  });

  describe('handleOrderCancelled', () => {
    it('주문 취소 이벤트 수신 시 양측에 알림 및 취소 메시지를 발송한다', async () => {
      await listener.handleOrderCancelled({
        orderId: 'ORD-10',
        saleId: 100,
        buyerId: 2,
        sellerId: 1,
        chatRoomId: 5,
        reason: '단순 변심',
      });

      expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(
        2,
      );
      expect(mockChatService.sendTradeMessage).toHaveBeenCalledWith(
        5,
        expect.stringContaining('단순 변심'),
        ChatMessageType.TRADE_STATUS,
        expect.objectContaining({ orderId: 'ORD-10', reason: '단순 변심' }),
      );
    });
  });

  describe('handleOrderExpired', () => {
    it('결제 시간 만료 이벤트 수신 시 결제 만료 알림 및 채팅 메시지를 발송한다', async () => {
      await listener.handleOrderExpired({
        orderId: 'ORD-10',
        saleId: 100,
        buyerId: 2,
        sellerId: 1,
        chatRoomId: 5,
      });

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        2,
        1,
        NotificationType.PAYMENT_EXPIRED,
        expect.objectContaining({ orderId: 'ORD-10' }),
      );
      expect(mockChatService.sendTradeMessage).toHaveBeenCalledWith(
        5,
        expect.stringContaining('결제 기한(24시간)이 만료'),
        ChatMessageType.TRADE_STATUS,
        expect.objectContaining({ orderId: 'ORD-10' }),
      );
    });
  });

  describe('warnings & review events', () => {
    it('자동확정 D-1 경고 수신 시 알림을 발송한다', async () => {
      await listener.handleAutoConfirmWarning({
        orderId: 'ORD-10',
        buyerId: 2,
        sellerId: 1,
        remainingHours: 24,
      });

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        2,
        1,
        NotificationType.AUTO_CONFIRM_IMMINENT,
        expect.objectContaining({ remainingHours: 24 }),
      );
    });

    it('배송기한 D-1 경고 수신 시 알림을 발송한다', async () => {
      await listener.handleShippingDeadlineWarning({
        orderId: 'ORD-10',
        buyerId: 2,
        sellerId: 1,
        remainingHours: 24,
      });

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        1,
        2,
        NotificationType.SHIPPING_DEADLINE_IMMINENT,
        expect.objectContaining({ remainingHours: 24 }),
      );
    });

    it('orderId 없는 현재 직거래 후기 payload로 알림을 만든다', async () => {
      await listener.handleTradeReviewCreated({
        reviewId: 100,
        completionId: 99,
        targetUserId: 1,
        reviewerId: 2,
      });

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        1,
        2,
        NotificationType.TRADE_REVIEW_RECEIVED,
        { reviewId: 100, orderId: undefined },
      );
    });

    it('거래 후기 등록 수신 시 판매자에게 알림을 발송한다', async () => {
      await listener.handleTradeReviewCreated({
        reviewId: 100,
        completionId: 99,
        targetUserId: 1,
        reviewerId: 2,
        orderId: 'ORD-10',
      });

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        1,
        2,
        NotificationType.TRADE_REVIEW_RECEIVED,
        expect.objectContaining({ reviewId: 100 }),
      );
    });
  });
});
