import { Logger, Type } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { EntityManager } from 'typeorm';

import { ChatCleanupListener } from '@/features/chat/listeners/chat-cleanup.listener';
import { CommentCleanupListener } from '@/features/comment/listeners/comment-cleanup.listener';
import { LlmCleanupListener } from '@/features/llm/listeners/llm-cleanup.listener';
import { NotificationCleanupListener } from '@/features/notification/listeners/notification-cleanup.listener';
import { ReadingLogCleanupListener } from '@/features/reading-log/listeners/reading-log-cleanup.listener';
import { ReviewCleanupListener } from '@/features/review/listeners/review-cleanup.listener';
import { UsedBookSaleCleanupListener } from '@/features/used-book-sale/listeners/used-book-sale-cleanup.listener';
import { ActivityCleanupListener } from '@/shared/activity/listeners/activity-cleanup.listener';

import { UserCleanupListener } from './user-cleanup.listener';

const listeners: Type<unknown>[] = [
  ChatCleanupListener,
  CommentCleanupListener,
  LlmCleanupListener,
  NotificationCleanupListener,
  ReadingLogCleanupListener,
  ReviewCleanupListener,
  UsedBookSaleCleanupListener,
  UserCleanupListener,
  ActivityCleanupListener,
];

describe('user.withdrawn 리스너', () => {
  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it.each(listeners.map((listener) => [listener.name, listener]))(
    '%s의 에러가 emitAsync까지 전파된다',
    async (_name, listener) => {
      const module = await Test.createTestingModule({
        imports: [EventEmitterModule.forRoot()],
        providers: [listener],
      }).compile();
      await module.init();

      const failure = new Error('db down');
      const entityManager = {
        find: jest.fn().mockRejectedValue(failure),
        delete: jest.fn().mockRejectedValue(failure),
        update: jest.fn().mockRejectedValue(failure),
      } as unknown as EntityManager;

      await expect(
        module
          .get(EventEmitter2)
          .emitAsync('user.withdrawn', { userId: 1, entityManager }),
      ).rejects.toThrow('db down');

      await module.close();
    },
  );
});
