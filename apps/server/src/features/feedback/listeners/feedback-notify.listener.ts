import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MailService } from '@/shared/mail/mail.service';

import { Feedback } from '../entities/feedback.entity';
import { FeedbackCreatedEvent } from '../services/feedback.service';

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

  @OnEvent('feedback.created', { async: true })
  async handleFeedbackCreated({ feedbackId }: FeedbackCreatedEvent) {
    try {
      const feedback = await this.feedbackRepository.findOne({
        where: { id: feedbackId },
        relations: { user: true },
      });
      if (!feedback) return;
      await this.mailService.sendFeedbackNotice(feedback);
    } catch (error) {
      this.logger.error(`문의 #${feedbackId} 운영자 알림 실패`, error);
    }
  }
}
