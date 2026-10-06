import { NotificationType } from '@bookjeok/core';
import { Injectable, Logger } from '@nestjs/common';

import { NotificationService } from '@/features/notification/services/notification.service';
import { OnDomainEvent } from '@/shared/events/domain-event';

import {
  ReadingLogEvents,
  ReadingLogKongSentEvent,
} from '../events/reading-log.events';

@Injectable()
export class ReadingLogNotificationListener {
  private readonly logger = new Logger(ReadingLogNotificationListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  /** 콩을 받으면 기록 주인에게 알린다. 한 기록에 한 사람이 한 알이라 중복 검사는 없다 */
  @OnDomainEvent(ReadingLogEvents.kongSent)
  async handleKongSent(event: ReadingLogKongSentEvent) {
    try {
      await this.notificationService.createNotification(
        event.ownerId,
        event.senderId,
        NotificationType.READING_LOG_KONG,
        {
          readingLogId: event.readingLogId,
          date: event.date,
          bookTitle: event.bookTitle,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify kong on reading log ${event.readingLogId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
