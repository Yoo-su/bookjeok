import { EventEmitter2 } from '@nestjs/event-emitter';
import type { EntityManager } from 'typeorm';

import { chatRoomCreatedEvent } from '@/features/chat/events/chat-room-created.event';
import {
  emitPendingOrderEvent,
  OrderEvents,
  PendingOrderEvent,
} from '@/features/order/events/order.events';
import { TradeEvents } from '@/features/trade/events/trade.events';
import { userWithdrawnEvent } from '@/features/user/events/user-withdrawn.event';
import {
  emitDomainEvent,
  emitDomainEventAsync,
  OnDomainEvent,
} from '@/shared/events/domain-event';

/** 실행하지 않는다. tsc가 잘못된 계약을 계속 거부하는지 검사한다. */
export function verifyDomainEventTypes(
  emitter: EventEmitter2,
  entityManager: EntityManager,
) {
  const parties = { orderId: 'order-1', saleId: 1, buyerId: 2, sellerId: 3 };
  emitDomainEvent(emitter, OrderEvents.buyer_selected, {
    ...parties,
    amount: 100,
  });
  emitDomainEvent(emitter, TradeEvents.reservation_cancelled, {
    saleId: 1,
    sellerId: 3,
    buyerId: null,
  });
  void emitDomainEventAsync(emitter, userWithdrawnEvent, {
    userId: 2,
    entityManager,
  });

  // @ts-expect-error: 결제 요청에는 amount가 필수다.
  emitDomainEvent(emitter, OrderEvents.buyer_selected, parties);
  // @ts-expect-error: 알 수 없는 문자열 이벤트를 발행할 수 없다.
  emitDomainEvent(emitter, 'order.buyer_selected', parties);
  // @ts-expect-error: 채팅 계약의 필수 필드를 빠뜨릴 수 없다.
  emitDomainEvent(emitter, chatRoomCreatedEvent, { chatRoomId: 1 });
  // @ts-expect-error: 탈퇴 리스너에 같은 트랜잭션의 매니저를 반드시 전달한다.
  void emitDomainEventAsync(emitter, userWithdrawnEvent, { userId: 2 });

  // @ts-expect-error: 대기 이벤트도 이름에 맞는 payload가 필요하다.
  const missingAmount: PendingOrderEvent = {
    name: OrderEvents.buyer_selected.name,
    payload: parties,
  };
  const unknownOrderEvent = {
    name: 'order.buyer_selectd',
    payload: parties,
  } as const;
  // @ts-expect-error: 주문 이벤트 이름 오타는 거절한다.
  emitPendingOrderEvent(emitter, unknownOrderEvent);
  const shippingAsPayment = {
    name: OrderEvents.payment_completed.name,
    payload: { ...parties, carrier: 'kr.cjlogistics' },
  };
  // @ts-expect-error: 배송 payload를 결제 완료 이름과 조합할 수 없다.
  emitPendingOrderEvent(emitter, shippingAsPayment);

  class InvalidListeners {
    // @ts-expect-error: 리스너가 필수 payload를 빼고 독립적인 타입을 정의하면 거절한다.
    @OnDomainEvent(OrderEvents.buyer_selected)
    missingField(event: { orderId: string }) {
      return event;
    }

    // @ts-expect-error: 예약 취소의 nullable buyerId를 리스너에서 좁힐 수 없다.
    @OnDomainEvent(TradeEvents.reservation_cancelled)
    nonNullable(event: { saleId: number; sellerId: number; buyerId: number }) {
      return event;
    }

    // @ts-expect-error: 다른 계약의 payload를 구독할 수 없다.
    @OnDomainEvent(chatRoomCreatedEvent)
    wrongPayload(event: { userId: number; entityManager: EntityManager }) {
      return event;
    }

    // @ts-expect-error: 구독도 문자열 이름을 직접 사용할 수 없다.
    @OnDomainEvent('chat.room_created')
    wrongName(event: { chatRoomId: number }) {
      return event;
    }
  }
  return { missingAmount, InvalidListeners };
}
