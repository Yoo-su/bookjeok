import type { TradeCompletionMethod } from '@/features/trade/entities/trade-completion.entity';
import { defineDomainEvent } from '@/shared/events/domain-event';

export interface TradeReservedEvent {
  saleId: number;
  sellerId: number;
  buyerId: number;
  chatRoomId?: number | null;
}

export interface TradeReservationCancelledEvent {
  saleId: number;
  sellerId: number;
  buyerId: number | null;
}

export interface TradeSaleSoldEvent {
  saleId: number;
  sellerId: number;
  chatRoomId?: number | null;
}

export interface TradeCompletedEvent {
  completionId: number;
  saleId: number;
  sellerId: number;
  buyerId: number;
  chatRoomId?: number | null;
  method: TradeCompletionMethod;
}

export const TradeEvents = {
  reserved: defineDomainEvent<TradeReservedEvent>()('trade.reserved'),
  reservation_cancelled: defineDomainEvent<TradeReservationCancelledEvent>()(
    'trade.reservation_cancelled',
  ),
  sale_sold: defineDomainEvent<TradeSaleSoldEvent>()('trade.sale_sold'),
  completed: defineDomainEvent<TradeCompletedEvent>()('trade.completed'),
};
