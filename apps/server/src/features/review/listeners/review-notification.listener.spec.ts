import { NotificationType } from '@/features/notification/entities/notification.entity';
import { NotificationService } from '@/features/notification/services/notification.service';
import { ReviewResponseDto } from '@/features/review/dtos/review-response.dto';

import { ReviewNotificationListener } from './review-notification.listener';

const review = {
  id: 42,
  userId: 1,
  book: { title: '사탄탱고' },
} as unknown as ReviewResponseDto;

describe('ReviewNotificationListener.handleReviewReacted', () => {
  let notificationService: {
    hasNotification: jest.Mock;
    createNotification: jest.Mock;
  };
  let listener: ReviewNotificationListener;

  beforeEach(() => {
    notificationService = {
      hasNotification: jest.fn().mockResolvedValue(false),
      createNotification: jest.fn().mockResolvedValue(undefined),
    };
    listener = new ReviewNotificationListener(
      notificationService as unknown as NotificationService,
    );
  });

  it('새 반응이면 작성자에게 알림을 보낸다', async () => {
    await listener.handleReviewReacted({ review, actorId: 2, isAdded: true });

    expect(notificationService.hasNotification).toHaveBeenCalledWith(
      1,
      2,
      NotificationType.REVIEW_REACTION,
      { reviewId: 42 },
    );
    expect(notificationService.createNotification).toHaveBeenCalledWith(
      1,
      2,
      NotificationType.REVIEW_REACTION,
      { reviewId: 42, bookTitle: '사탄탱고' },
    );
  });

  it('같은 사람이 같은 리뷰로 이미 알림을 보냈다면 다시 보내지 않는다', async () => {
    notificationService.hasNotification.mockResolvedValue(true);

    await listener.handleReviewReacted({ review, actorId: 2, isAdded: true });

    expect(notificationService.createNotification).not.toHaveBeenCalled();
  });

  it('취소나 종류 변경(isAdded=false)은 알림 대상이 아니다', async () => {
    await listener.handleReviewReacted({ review, actorId: 2, isAdded: false });

    expect(notificationService.hasNotification).not.toHaveBeenCalled();
    expect(notificationService.createNotification).not.toHaveBeenCalled();
  });

  it('본인 리뷰에 남긴 반응은 알리지 않는다', async () => {
    await listener.handleReviewReacted({ review, actorId: 1, isAdded: true });

    expect(notificationService.createNotification).not.toHaveBeenCalled();
  });
});
