import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationModule } from '@/features/notification/notification.module';

import { AdminFeedbackController } from './controllers/admin-feedback.controller';
import { FeedbackController } from './controllers/feedback.controller';
import { Feedback } from './entities/feedback.entity';
import { FeedbackCleanupListener } from './listeners/feedback-cleanup.listener';
import { FeedbackNotifyListener } from './listeners/feedback-notify.listener';
import { FeedbackReplyNotifyListener } from './listeners/feedback-reply-notify.listener';
import { FeedbackService } from './services/feedback.service';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback]), NotificationModule],
  controllers: [FeedbackController, AdminFeedbackController],
  providers: [
    FeedbackService,
    FeedbackNotifyListener,
    FeedbackReplyNotifyListener,
    FeedbackCleanupListener,
  ],
})
export class FeedbackModule {}
