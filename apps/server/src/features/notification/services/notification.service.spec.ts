import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import {
  Notification,
  NotificationType,
} from '../entities/notification.entity';
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
      { feedbackId: 5 },
    );

    expect(repo.create).toHaveBeenCalledWith({
      recipient: { id: 1 },
      type: NotificationType.FEEDBACK_REPLIED,
      metadata: { feedbackId: 5 },
    });
    expect(gateway.sendNotification).toHaveBeenCalledWith(1, {
      id: 11,
      actor: null,
    });
  });

  it('자기 행동으로 자기에게 가는 알림은 만들지 않는다', async () => {
    await service.createNotification(1, 1, NotificationType.COMMENT_LIKE, {});

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('다른 사람의 행동은 actor를 붙여 저장한다', async () => {
    await service.createNotification(1, 2, NotificationType.COMMENT_LIKE, {});

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ actor: { id: 2 } }),
    );
  });
});
