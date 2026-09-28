import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { EmailVerifiedGuard } from '@/features/auth/guards/email-verified.guard';
import { CurrentUser } from '@/features/user/decorators/current-user.decorator';
import { User } from '@/features/user/entities/user.entity';
import { IdempotencyInterceptor } from '@/shared/interceptors/idempotency.interceptor';

import { CancelOrderDto } from '../dtos/cancel-order.dto';
import { ConfirmPaymentDto } from '../dtos/confirm-payment.dto';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { DisputeOrderDto } from '../dtos/dispute-order.dto';
import { QueryOrderDto } from '../dtos/query-order.dto';
import { RegisterShippingDto } from '../dtos/register-shipping.dto';
import { Order } from '../entities/order.entity';
import { PaymentFeatureGuard } from '../guards/payment-feature.guard';
import { OrderService } from '../services/order.service';

@ApiTags('주문/결제 (Order)')
@Controller('orders')
@UseGuards(PaymentFeatureGuard, AuthGuard('jwt'))
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(EmailVerifiedGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({
    summary: '구매자 선택 및 주문 생성',
    description:
      '판매자가 채팅 중인 구매자를 거래 상대로 선택하여 주문을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '주문이 성공적으로 생성되었습니다.',
  })
  async selectBuyer(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: User,
  ): Promise<Order> {
    return await this.orderService.selectBuyer(createOrderDto, user.id);
  }

  @Delete(':id/selection')
  @UseInterceptors(IdempotencyInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '구매자 선택 취소',
    description: '결제 전 단계에서 판매자가 구매자 지정을 취소합니다.',
  })
  @ApiParam({ name: 'id', description: '주문 ID' })
  async cancelSelection(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Order> {
    return await this.orderService.cancelSelection(id, user.id);
  }

  @Post(':id/pay')
  @UseGuards(EmailVerifiedGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '결제 완료 처리',
    description: '구매자가 결제를 완료하고 배송지 정보를 등록합니다.',
  })
  @ApiParam({ name: 'id', description: '주문 ID 또는 주문번호' })
  async confirmPayment(
    @Param('id') id: string,
    @Body() confirmPaymentDto: ConfirmPaymentDto,
    @CurrentUser() user: User,
  ): Promise<Order> {
    return await this.orderService.confirmPayment(
      id,
      user.id,
      confirmPaymentDto,
    );
  }

  @Post(':id/ship')
  @UseInterceptors(IdempotencyInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '운송장 등록 (배송 시작)',
    description: '판매자가 택배사 및 운송장 번호를 등록하여 배송을 시작합니다.',
  })
  @ApiParam({ name: 'id', description: '주문 ID' })
  async registerShipping(
    @Param('id') id: string,
    @Body() registerShippingDto: RegisterShippingDto,
    @CurrentUser() user: User,
  ): Promise<Order> {
    return await this.orderService.registerShipping(
      id,
      user.id,
      registerShippingDto,
    );
  }

  @Post(':id/confirm')
  @UseInterceptors(IdempotencyInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '구매확정',
    description: '구매자가 배송 완료 후 구매를 확정합니다.',
  })
  @ApiParam({ name: 'id', description: '주문 ID' })
  async confirmPurchase(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Order> {
    return await this.orderService.confirmPurchase(id, user.id);
  }

  @Post(':id/dispute')
  @UseInterceptors(IdempotencyInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '구매확정 거부 (이의 제기)',
    description:
      '구매자가 상품에 문제가 있어 구매확정을 거부하고 분쟁을 제기합니다.',
  })
  @ApiParam({ name: 'id', description: '주문 ID' })
  async disputeOrder(
    @Param('id') id: string,
    @Body() disputeOrderDto: DisputeOrderDto,
    @CurrentUser() user: User,
  ): Promise<Order> {
    return await this.orderService.disputeOrder(id, user.id, disputeOrderDto);
  }

  @Post(':id/cancel')
  @UseInterceptors(IdempotencyInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '주문 취소',
    description: '배송 전 단계에서 구매자 또는 판매자가 주문을 취소합니다.',
  })
  @ApiParam({ name: 'id', description: '주문 ID' })
  async cancelOrder(
    @Param('id') id: string,
    @Body() cancelOrderDto: CancelOrderDto,
    @CurrentUser() user: User,
  ): Promise<Order> {
    return await this.orderService.cancelOrder(id, user.id, cancelOrderDto);
  }

  @Get('my-purchases')
  @ApiOperation({
    summary: '내 구매 주문 목록 조회',
    description: '로그인한 사용자의 구매 주문 내역을 조회합니다.',
  })
  async getMyPurchases(
    @Query() query: QueryOrderDto,
    @CurrentUser() user: User,
  ) {
    return await this.orderService.getMyPurchases(user.id, query);
  }

  @Get('my-sales')
  @ApiOperation({
    summary: '내 판매 주문 목록 조회',
    description: '로그인한 사용자의 판매 주문 내역을 조회합니다.',
  })
  async getMySales(@Query() query: QueryOrderDto, @CurrentUser() user: User) {
    return await this.orderService.getMySales(user.id, query);
  }

  @Get('by-room/:roomId')
  @ApiOperation({
    summary: '채팅방의 주문 정보 조회',
    description: '특정 채팅방의 최근/활성 주문 정보를 조회합니다.',
  })
  @ApiParam({ name: 'roomId', description: '채팅방 ID' })
  async getActiveOrderByRoom(
    @Param('roomId') roomId: string,
    @CurrentUser() user: User,
  ): Promise<Order | null> {
    return await this.orderService.getActiveOrderByRoom(
      Number(roomId),
      user.id,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: '주문 상세 조회',
    description:
      '특정 주문의 상세 정보를 조회합니다. (ID 또는 주문번호로 조회 가능)',
  })
  @ApiParam({ name: 'id', description: '주문 ID 또는 주문번호' })
  async getOrder(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<Order> {
    return await this.orderService.getOrder(id, user.id);
  }
}
