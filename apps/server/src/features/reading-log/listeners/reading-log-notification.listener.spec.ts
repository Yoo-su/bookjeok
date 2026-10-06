import { NotificationType } from '@bookjeok/core';

import { NotificationService } from '@/features/notification/services/notification.service';

import { ReadingLogNotificationListener } from './reading-log-notification.listener';

const event = {
  readingLogId: '11111111-1111-4111-8111-111111111111',
  ownerId: 1,
  senderId: 2,
  date: '2026-10-05',
  bookTitle: '채식주의자',
};

describe('ReadingLogNotificationListener.handleKongSent', () => {
  let notificationService: { createNotification: jest.Mock };
  let listener: ReadingLogNotificationListener;

  beforeEach(() => {
    notificationService = {
      createNotification: jest.fn().mockResolvedValue(undefined),
    };
    listener = new ReadingLogNotificationListener(
      notificationService as unknown as NotificationService,
    );
  });

  it('기록 주인에게 그날로 갈 수 있는 알림을 보낸다', async () => {
    await listener.handleKongSent(event);

    expect(notificationService.createNotification).toHaveBeenCalledWith(
      1,
      2,
      NotificationType.READING_LOG_KONG,
      {
        readingLogId: event.readingLogId,
        date: '2026-10-05',
        bookTitle: '채식주의자',
      },
    );
  });

  it('알림 저장이 실패해도 콩 보내기를 실패로 만들지 않는다', async () => {
    notificationService.createNotification.mockRejectedValue(new Error('db'));

    await expect(listener.handleKongSent(event)).resolves.toBeUndefined();
  });
});
