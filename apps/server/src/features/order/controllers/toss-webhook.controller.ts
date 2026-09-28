import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  SaleStatus,
  UsedBookSale,
} from '@/features/used-book-sale/entities/used-book-sale.entity';

import { Order, OrderStatus } from '../entities/order.entity';
import { PaymentFeatureGuard } from '../guards/payment-feature.guard';
import { TossPaymentsService } from '../services/toss-payments.service';

@ApiTags('주문/결제 웹훅 (Order Webhook)')
@Controller('orders/webhook')
@UseGuards(PaymentFeatureGuard)
export class TossWebhookController {
  private readonly logger = new Logger(TossWebhookController.name);

  constructor(
    private readonly tossPaymentsService: TossPaymentsService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(UsedBookSale)
    private readonly saleRepository: Repository<UsedBookSale>,
  ) {}

  @Post('toss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '토스페이먼츠 웹훅 수신',
    description:
      '토스페이먼츠 결제 상태 변경 이벤트를 수신하여 주문 상태를 동기화합니다.',
  })
  @ApiResponse({ status: 200, description: '웹훅 정상 처리' })
  async handleTossWebhook(
    @Body() payload: Record<string, any>,
  ): Promise<{ status: string }> {
    this.logger.log(`토스페이먼츠 웹훅 수신: ${JSON.stringify(payload)}`);

    if (!this.tossPaymentsService.verifyWebhook(payload)) {
      this.logger.warn('유효하지 않은 토스 웹훅 페이로드입니다.');
      return { status: 'INVALID_PAYLOAD' };
    }

    const { data } = payload;
    const paymentData = data || payload;
    const orderId = paymentData.orderId;
    const tossStatus = paymentData.status;

    if (!orderId) {
      return { status: 'OK' };
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['sale'],
    });

    if (!order) {
      this.logger.warn(`웹훅 주문을 찾을 수 없습니다 (orderId: ${orderId})`);
      return { status: 'OK' };
    }

    // 상태 동기화 처리
    if (
      tossStatus === 'DONE' &&
      order.status === OrderStatus.AWAITING_PAYMENT
    ) {
      order.status = OrderStatus.PAID;
      order.paymentKey = paymentData.paymentKey || order.paymentKey;
      order.paidAt = new Date();
      await this.orderRepository.save(order);
    } else if (
      (tossStatus === 'CANCELED' || tossStatus === 'EXPIRED') &&
      order.status !== OrderStatus.CANCELLED
    ) {
      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      order.cancelReason = paymentData.cancelReason || '토스 웹훅 취소/만료';
      await this.orderRepository.save(order);

      if (order.sale) {
        order.sale.status = SaleStatus.FOR_SALE;
        await this.saleRepository.save(order.sale);
      }
    }

    return { status: 'OK' };
  }
}
