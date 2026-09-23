import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { NotificationType } from '@/features/notification/entities/notification.entity';
import { NotificationService } from '@/features/notification/services/notification.service';
import { ReviewResponseDto } from '@/features/review/dtos/review-response.dto';

@Injectable()
export class ReviewNotificationListener {
  private readonly logger = new Logger(ReviewNotificationListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 리뷰 리액션 추가 시 리뷰 작성자에게 알림을 발송합니다.
   */
  @OnEvent('review.reacted')
  async handleReviewReacted(event: {
    review: ReviewResponseDto;
    actorId: number;
    isAdded: boolean;
  }) {
    const { review, actorId, isAdded } = event;

    try {
      // 리액션을 취소(해제)한 경우 알림 제외
      if (!isAdded) return;

      // 본인 글에 리액션을 남긴 경우 알림 제외
      if (review.userId === actorId) return;

      // 같은 사람이 같은 리뷰에 반응을 껐다 켜도 알림은 한 번만 보낸다
      const alreadyNotified = await this.notificationService.hasNotification(
        review.userId,
        actorId,
        NotificationType.REVIEW_REACTION,
        { reviewId: review.id },
      );
      if (alreadyNotified) return;

      await this.notificationService.createNotification(
        review.userId,
        actorId,
        NotificationType.REVIEW_REACTION,
        {
          reviewId: review.id,
          bookTitle: review.book?.title || '알 수 없는 책',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to process review reaction notification for review ${review.id}: ${error.message}`,
        error.stack,
      );
    }
  }
}
