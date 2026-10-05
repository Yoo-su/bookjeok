import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, LessThanOrEqual, Not, Repository } from 'typeorm';

import { OrderEvents } from '@/features/order/events/order.events';
import { isPaymentEnabled } from '@/shared/config/feature-flags';
import { emitDomainEvent } from '@/shared/events/domain-event';

import { Order, OrderStatus } from '../entities/order.entity';
import { DeliveryTrackerService } from './delivery-tracker.service';
import { OrderService } from './order.service';

@Injectable()
export class OrderSchedulerService {
  private readonly logger = new Logger(OrderSchedulerService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly orderService: OrderService,
    private readonly deliveryTrackerService: DeliveryTrackerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 24시간 동안 미결제된 주문을 자동으로 취소합니다. (5분 주기)
   * AWAITING_PAYMENT 상태이며 expiresAt이 지난 주문 대상
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredOrders(): Promise<number> {
    if (!isPaymentEnabled()) {
      return 0;
    }

    const now = new Date();
    const expiredOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.AWAITING_PAYMENT,
        expiresAt: LessThanOrEqual(now),
      },
    });

    if (expiredOrders.length === 0) {
      return 0;
    }

    this.logger.log(
      `[자동 만료] 24시간 미결제 주문 ${expiredOrders.length}건 처리 시작`,
    );

    let processedCount = 0;
    for (const order of expiredOrders) {
      try {
        await this.orderService.systemCancelOrder(
          order.id,
          '결제 기한(24시간) 만료로 인한 자동 취소',
        );

        emitDomainEvent(this.eventEmitter, OrderEvents.expired, {
          orderId: order.id,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          saleId: order.saleId,
          chatRoomId: order.chatRoomId,
        });

        processedCount++;
      } catch (error) {
        this.logger.error(
          `주문 ID ${order.id} 만료 처리 실패: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(`[자동 만료] 총 ${processedCount}건 처리 완료`);
    return processedCount;
  }

  /**
   * 결제 후 3일간 운송장이 등록되지 않은 주문을 자동 취소 및 환불 처리합니다. (5분 주기)
   * PAID 상태이며 paidAt 기준 3일이 경과한 주문 대상
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleUnshippedOrders(): Promise<number> {
    if (!isPaymentEnabled()) {
      return 0;
    }

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const unshippedOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.PAID,
        paidAt: LessThanOrEqual(threeDaysAgo),
      },
    });

    if (unshippedOrders.length === 0) {
      return 0;
    }

    this.logger.log(
      `[미배송 취소] 3일 미배송 주문 ${unshippedOrders.length}건 환불 처리 시작`,
    );

    let processedCount = 0;
    for (const order of unshippedOrders) {
      try {
        const cancelReason =
          '결제 후 3일 이내 미배송으로 인한 자동 취소 및 환불';
        await this.orderService.systemCancelOrder(order.id, cancelReason);

        emitDomainEvent(this.eventEmitter, OrderEvents.unshipped_cancelled, {
          orderId: order.id,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          saleId: order.saleId,
          chatRoomId: order.chatRoomId,
          reason: cancelReason,
        });

        processedCount++;
      } catch (error) {
        this.logger.error(
          `주문 ID ${order.id} 미배송 자동 취소 실패: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(`[미배송 취소] 총 ${processedCount}건 처리 완료`);
    return processedCount;
  }

  /**
   * 배송 완료 후 2일간 구매확정 또는 이의제기가 없는 주문을 자동 구매확정합니다. (5분 주기)
   * DELIVERED 상태이며 deliveredAt 기준 2일이 경과한 주문 대상
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleAutoConfirm(): Promise<number> {
    if (!isPaymentEnabled()) {
      return 0;
    }

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const deliveredOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.DELIVERED,
        deliveredAt: LessThanOrEqual(twoDaysAgo),
      },
    });

    if (deliveredOrders.length === 0) {
      return 0;
    }

    this.logger.log(
      `[자동 구매확정] 배송완료 2일 경과 주문 ${deliveredOrders.length}건 처리 시작`,
    );

    let processedCount = 0;
    for (const order of deliveredOrders) {
      try {
        await this.orderService.autoConfirmPurchase(order.id);

        emitDomainEvent(this.eventEmitter, OrderEvents.auto_confirmed, {
          orderId: order.id,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          saleId: order.saleId,
          chatRoomId: order.chatRoomId,
        });

        processedCount++;
      } catch (error) {
        this.logger.error(
          `주문 ID ${order.id} 자동 구매확정 실패: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(`[자동 구매확정] 총 ${processedCount}건 처리 완료`);
    return processedCount;
  }

  /**
   * 분쟁 제기 후 7일 동안 해결되지 않은 주문을 자동 환불 처리합니다. (5분 주기)
   * DISPUTED 상태이며 disputedAt 기준 7일이 경과한 주문 대상
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredDisputes(): Promise<number> {
    if (!isPaymentEnabled()) {
      return 0;
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const expiredDisputes = await this.orderRepository.find({
      where: {
        status: OrderStatus.DISPUTED,
        disputedAt: LessThanOrEqual(sevenDaysAgo),
      },
    });

    if (expiredDisputes.length === 0) {
      return 0;
    }

    this.logger.log(
      `[분쟁 자동환불] 7일 미해결 분쟁 주문 ${expiredDisputes.length}건 환불 처리 시작`,
    );

    let processedCount = 0;
    for (const order of expiredDisputes) {
      try {
        const cancelReason = '분쟁 접수 후 7일 경과로 인한 자동 환불';
        await this.orderService.systemCancelOrder(order.id, cancelReason);

        emitDomainEvent(
          this.eventEmitter,
          OrderEvents.dispute_expired_refunded,
          {
            orderId: order.id,
            buyerId: order.buyerId,
            sellerId: order.sellerId,
            saleId: order.saleId,
            chatRoomId: order.chatRoomId,
            reason: cancelReason,
          },
        );

        processedCount++;
      } catch (error) {
        this.logger.error(
          `주문 ID ${order.id} 분쟁 만료 자동 환불 실패: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(`[분쟁 자동환불] 총 ${processedCount}건 처리 완료`);
    return processedCount;
  }

  /**
   * 배송 중(SHIPPED)인 주문의 배송 상태를 외부 API로 주기적 추적하여 배송완료 시 markDelivered를 호출합니다. (30분 주기)
   */
  @Cron('*/30 * * * *')
  async pollDeliveryStatus(): Promise<number> {
    if (!isPaymentEnabled()) {
      return 0;
    }

    const shippedOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.SHIPPED,
        carrier: Not(IsNull()),
        trackingNumber: Not(IsNull()),
      },
    });

    if (shippedOrders.length === 0) {
      return 0;
    }

    this.logger.log(
      `[배송 추적 폴링] 배송 중 주문 ${shippedOrders.length}건 상태 확인 시작`,
    );

    let deliveredCount = 0;
    for (const order of shippedOrders) {
      try {
        if (!order.carrier || !order.trackingNumber) continue;

        const isDelivered = await this.deliveryTrackerService.isDelivered(
          order.carrier,
          order.trackingNumber,
        );

        if (isDelivered) {
          // markDelivered 내부에서 order.delivery_completed 이벤트를 이미 발행함
          await this.orderService.markDelivered(order.id);

          deliveredCount++;
          this.logger.log(
            `주문 ID ${order.id} 배송 완료 감지 -> DELIVERED 전이`,
          );
        }
      } catch (error) {
        this.logger.error(
          `주문 ID ${order.id} 배송 추적 폴링 실패: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `[배송 추적 폴링] 총 ${shippedOrders.length}건 중 ${deliveredCount}건 배송 완료 처리`,
    );
    return deliveredCount;
  }

  /**
   * 자동구매확정 D-1 및 배송기한 D-1 사전 경고 알림 이벤트를 발송합니다. (매일 자정 00:00 UTC)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async sendExpiryWarnings(): Promise<{
    autoConfirmWarnings: number;
    shippingDeadlineWarnings: number;
  }> {
    if (!isPaymentEnabled()) {
      return { autoConfirmWarnings: 0, shippingDeadlineWarnings: 0 };
    }

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // 1. 자동구매확정 D-1 (deliveredAt 기준 1일 이상 ~ 2일 미만 경과)
    const autoConfirmStart = new Date(now - 2 * oneDayMs);
    const autoConfirmEnd = new Date(now - 1 * oneDayMs);

    const autoConfirmWarningOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.DELIVERED,
        deliveredAt: Between(autoConfirmStart, autoConfirmEnd),
      },
    });

    let autoConfirmWarnings = 0;
    for (const order of autoConfirmWarningOrders) {
      try {
        emitDomainEvent(this.eventEmitter, OrderEvents.auto_confirm_warning, {
          orderId: order.id,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          remainingHours: 24,
        });
        autoConfirmWarnings++;
      } catch (error) {
        this.logger.error(
          `주문 ID ${order.id} 자동구매확정 D-1 경고 발송 실패: ${(error as Error).message}`,
        );
      }
    }

    // 2. 배송기한 D-1 (paidAt 기준 2일 이상 ~ 3일 미만 경과)
    const shippingStart = new Date(now - 3 * oneDayMs);
    const shippingEnd = new Date(now - 2 * oneDayMs);

    const shippingWarningOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.PAID,
        paidAt: Between(shippingStart, shippingEnd),
      },
    });

    let shippingDeadlineWarnings = 0;
    for (const order of shippingWarningOrders) {
      try {
        emitDomainEvent(
          this.eventEmitter,
          OrderEvents.shipping_deadline_warning,
          {
            orderId: order.id,
            buyerId: order.buyerId,
            sellerId: order.sellerId,
            remainingHours: 24,
          },
        );
        shippingDeadlineWarnings++;
      } catch (error) {
        this.logger.error(
          `주문 ID ${order.id} 배송기한 D-1 경고 발송 실패: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `[사전 경고] 자동확정 D-1 ${autoConfirmWarnings}건, 배송기한 D-1 ${shippingDeadlineWarnings}건 경고 발송 완료`,
    );

    return { autoConfirmWarnings, shippingDeadlineWarnings };
  }
}
