import { Injectable } from '@nestjs/common';

import {
  ChatRoomCreatedEvent,
  chatRoomCreatedEvent,
} from '@/features/chat/events/chat-room-created.event';
import { chatRoomCreatedMail } from '@/features/chat/mail/chat-room-created.mail';
import { OnDomainEvent } from '@/shared/events/domain-event';
import { MailService } from '@/shared/mail/mail.service';

@Injectable()
export class ChatMailListener {
  constructor(private readonly mailService: MailService) {}

  @OnDomainEvent(chatRoomCreatedEvent, { async: true })
  async handleChatRoomCreated(event: ChatRoomCreatedEvent) {
    await this.mailService.send(chatRoomCreatedMail, event);
  }
}
