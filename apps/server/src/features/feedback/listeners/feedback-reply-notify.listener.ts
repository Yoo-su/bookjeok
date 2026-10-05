import { NotificationType } from '@bookjeok/core';
import { Injectable, Logger } from '@nestjs/common';

import {
  FeedbackEvents,
  FeedbackRepliedEvent,
} from '@/features/feedback/events/feedback.events';
import { NotificationService } from '@/features/notification/services/notification.service';
import { OnDomainEvent } from '@/shared/events/domain-event';

/**
 * 운영자 답변이 달리면 작성자에게 북적 알림을 보낸다 (행위자 없음)
 */
@Injectable()
export class FeedbackReplyNotifyListener {
  private readonly logger = new Logger(FeedbackReplyNotifyListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnDomainEvent(FeedbackEvents.replied, { async: true })
  async handleFeedbackReplied(event: FeedbackRepliedEvent) {
    try {
      await this.notificationService.createNotification(
        event.userId,
        null,
        NotificationType.FEEDBACK_REPLIED,
        {
          feedbackId: event.feedbackId,
          feedbackType: event.type,
          ...(event.bookTitle && { bookTitle: event.bookTitle }),
        },
      );
    } catch (error) {
      this.logger.error(`문의 #${event.feedbackId} 답변 알림 실패`, error);
    }
  }
}
