import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  FeedbackCreatedEvent,
  FeedbackEvents,
} from '@/features/feedback/events/feedback.events';
import { feedbackNoticeMail } from '@/features/feedback/mail/feedback-notice.mail';
import { OnDomainEvent } from '@/shared/events/domain-event';
import { MailService } from '@/shared/mail/mail.service';

import { Feedback } from '../entities/feedback.entity';

/**
 * 문의가 접수되면 운영자에게 메일로 알린다
 * - 메일 실패는 접수 결과에 영향을 주지 않는다
 */
@Injectable()
export class FeedbackNotifyListener {
  private readonly logger = new Logger(FeedbackNotifyListener.name);

  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    private readonly mailService: MailService,
  ) {}

  @OnDomainEvent(FeedbackEvents.created, { async: true })
  async handleFeedbackCreated({ feedbackId }: FeedbackCreatedEvent) {
    try {
      const feedback = await this.feedbackRepository.findOne({
        where: { id: feedbackId },
        relations: { user: true },
      });
      if (!feedback) return;
      await this.mailService.send(feedbackNoticeMail, feedback);
    } catch (error) {
      this.logger.error(`문의 #${feedbackId} 운영자 알림 실패`, error);
    }
  }
}
