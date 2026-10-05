import { FeedbackType, NotificationType } from '@bookjeok/core';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Notification } from '@/features/notification/entities/notification.entity';

import { NotificationGateway } from '../gateways/notification.gateway';
import { NotificationService } from './notification.service';

describe('NotificationService.createNotification', () => {
  let service: NotificationService;
  let repo: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let gateway: { sendNotification: jest.Mock };

  beforeEach(async () => {
    repo = {
      create: jest.fn((value: Partial<Notification>) => value),
      save: jest.fn((value: Partial<Notification>) =>
        Promise.resolve({ ...value, id: 11 }),
      ),
      findOne: jest.fn().mockResolvedValue({ id: 11, actor: null }),
    };
    gateway = { sendNotification: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getRepositoryToken(Notification), useValue: repo },
        { provide: NotificationGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get(NotificationService);
  });

  it('행위자 없는 알림은 actor 없이 저장하고 실시간으로 보낸다', async () => {
    await service.createNotification(
      1,
      null,
      NotificationType.FEEDBACK_REPLIED,
      { feedbackId: 5, feedbackType: FeedbackType.OTHER },
    );

    expect(repo.create).toHaveBeenCalledWith({
      recipient: { id: 1 },
      type: NotificationType.FEEDBACK_REPLIED,
      metadata: { feedbackId: 5, feedbackType: FeedbackType.OTHER },
    });
    expect(gateway.sendNotification).toHaveBeenCalledWith(1, {
      id: 11,
      actor: null,
    });
  });

  it('저장 완료 후 actor를 다시 조회해 같은 metadata를 실시간 전달한다', async () => {
    const metadata = { saleId: 3, completionId: 4 };
    const populated = {
      id: 11,
      type: NotificationType.TRADE_COMPLETED,
      metadata,
      actor: { id: 2 },
    };
    repo.findOne.mockResolvedValue(populated);

    const saved = await service.createNotification(
      1,
      2,
      NotificationType.TRADE_COMPLETED,
      metadata,
    );

    expect(saved).toEqual({
      id: 11,
      recipient: { id: 1 },
      actor: { id: 2 },
      type: NotificationType.TRADE_COMPLETED,
      metadata,
    });
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 11 },
      relations: ['actor'],
    });
    expect(gateway.sendNotification).toHaveBeenCalledWith(1, populated);
    expect(repo.save.mock.invocationCallOrder[0]).toBeLessThan(
      repo.findOne.mock.invocationCallOrder[0],
    );
    expect(repo.findOne.mock.invocationCallOrder[0]).toBeLessThan(
      gateway.sendNotification.mock.invocationCallOrder[0],
    );
  });

  it('저장 실패 시 실시간 전달하지 않는다', async () => {
    repo.save.mockRejectedValue(new Error('DB failure'));
    await expect(
      service.createNotification(1, 2, NotificationType.TRADE_RESERVED, {
        saleId: 3,
      }),
    ).rejects.toThrow('DB failure');
    expect(repo.findOne).not.toHaveBeenCalled();
    expect(gateway.sendNotification).not.toHaveBeenCalled();
  });

  it('자기 행동으로 자기에게 가는 알림은 만들지 않는다', async () => {
    await service.createNotification(1, 1, NotificationType.COMMENT_LIKE, {
      commentId: 7,
      reviewId: null,
    });

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('다른 사람의 행동은 actor를 붙여 저장한다', async () => {
    await service.createNotification(1, 2, NotificationType.COMMENT_LIKE, {
      commentId: 7,
      reviewId: null,
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ actor: { id: 2 } }),
    );
  });
});

// ts-jest/tsc가 실제 서비스 입구의 잘못된 metadata를 거부하는지 확인한다.
function checkCreationContract(
  service: NotificationService,
  type: NotificationType,
) {
  // @ts-expect-error 완료 알림에는 completionId가 필수
  void service.createNotification(1, 2, NotificationType.TRADE_COMPLETED, {
    saleId: 3,
  });
  // @ts-expect-error type이 union이면 특정 종류 metadata를 임의로 결합할 수 없다
  void service.createNotification(1, 2, type, { saleId: 3 });
  void service.hasNotification(1, 2, NotificationType.REVIEW_REACTION, {
    // @ts-expect-error 중복 확인에서도 해당 종류에 없는 필드는 거부한다
    saleId: 3,
  });
}
void checkCreationContract;
