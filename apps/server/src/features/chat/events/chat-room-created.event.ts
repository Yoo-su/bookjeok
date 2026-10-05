import { defineDomainEvent } from '@/shared/events/domain-event';
import type { EmailRecipient } from '@/shared/mail/mail-recipient';

export const CHAT_ROOM_CREATED_EVENT = 'chat.room_created';

export interface ChatRoomCreatedEvent {
  seller: EmailRecipient & { id: number; nickname: string };
  buyerNickname: string;
  bookTitle: string;
  chatRoomId: number;
}

export const chatRoomCreatedEvent = defineDomainEvent<ChatRoomCreatedEvent>()(
  CHAT_ROOM_CREATED_EVENT,
);
