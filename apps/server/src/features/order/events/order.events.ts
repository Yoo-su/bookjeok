import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  defineDomainEvent,
  PendingDomainEvent,
} from '@/shared/events/domain-event';

export interface OrderBuyerSelectedEvent {
  orderId: string;
  saleId: number;
  buyerId: number;
  sellerId: number;
  amount: number;
  chatRoomId?: number | null;
}

export interface OrderPaymentCompletedEvent {
  orderId: string;
  saleId: number;
  buyerId: number;
  sellerId: number;
  amount: number;
  chatRoomId?: number | null;
}

export interface OrderShippingStartedEvent {
  orderId: string;
  saleId: number;
  buyerId: number;
  sellerId: number;
  carrier?: string | null;
  trackingNumber?: string | null;
  chatRoomId?: number | null;
}

export interface OrderDeliveryCompletedEvent {
  orderId: string;
  saleId: number;
  buyerId: number;
  sellerId: number;
  chatRoomId?: number | null;
}

export interface OrderConfirmedEvent {
  orderId: string;
  saleId: number;
  buyerId: number;
  sellerId: number;
  chatRoomId?: number | null;
}

export interface OrderDisputedEvent {
  orderId: string;
  saleId: number;
  buyerId: number;
  sellerId: number;
  chatRoomId?: number | null;
  disputeReason?: string | null;
}

export interface OrderCancelledEvent {
  orderId: string;
  saleId: number;
  buyerId: number;
  sellerId: number;
  chatRoomId?: number | null;
  reason?: string | null;
}

export interface OrderExpiredEvent {
  orderId: string;
  saleId: number;
  buyerId: number;
  sellerId: number;
  chatRoomId?: number | null;
}

export interface OrderAutoConfirmWarningEvent {
  orderId: string;
  buyerId: number;
  sellerId: number;
  remainingHours: number;
}

export interface OrderShippingDeadlineWarningEvent {
  orderId: string;
  buyerId: number;
  sellerId: number;
  remainingHours: number;
}

export const OrderEvents = {
  buyer_selected: defineDomainEvent<OrderBuyerSelectedEvent>()(
    'order.buyer_selected',
  ),
  payment_completed: defineDomainEvent<OrderPaymentCompletedEvent>()(
    'order.payment_completed',
  ),
  shipping_started: defineDomainEvent<OrderShippingStartedEvent>()(
    'order.shipping_started',
  ),
  delivery_completed: defineDomainEvent<OrderDeliveryCompletedEvent>()(
    'order.delivery_completed',
  ),
  confirmed: defineDomainEvent<OrderConfirmedEvent>()('order.confirmed'),
  auto_confirmed: defineDomainEvent<OrderConfirmedEvent>()(
    'order.auto_confirmed',
  ),
  disputed: defineDomainEvent<OrderDisputedEvent>()('order.disputed'),
  cancelled: defineDomainEvent<OrderCancelledEvent>()('order.cancelled'),
  unshipped_cancelled: defineDomainEvent<OrderCancelledEvent>()(
    'order.unshipped_cancelled',
  ),
  dispute_expired_refunded: defineDomainEvent<OrderCancelledEvent>()(
    'order.dispute_expired_refunded',
  ),
  expired: defineDomainEvent<OrderExpiredEvent>()('order.expired'),
  auto_confirm_warning: defineDomainEvent<OrderAutoConfirmWarningEvent>()(
    'order.auto_confirm_warning',
  ),
  shipping_deadline_warning:
    defineDomainEvent<OrderShippingDeadlineWarningEvent>()(
      'order.shipping_deadline_warning',
    ),
};

/** 이름과 payload의 대응을 커밋 후 발행 지점까지 보존한다. */
export type PendingOrderEvent = {
  [Key in keyof typeof OrderEvents]: PendingDomainEvent<
    (typeof OrderEvents)[Key]
  >;
}[keyof typeof OrderEvents];

/** 커밋 후 호출한다. 이름과 payload가 연결된 주문 계약만 받는다. */
export function emitPendingOrderEvent(
  emitter: EventEmitter2,
  event: PendingOrderEvent,
): boolean {
  return emitter.emit(event.name, event.payload);
}
