import {
  FEEDBACK_LIST_LIMIT,
  FeedbackStatus,
  FeedbackType,
} from '@bookjeok/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '@/features/user/entities/user.entity';

import { Feedback } from '../entities/feedback.entity';
import { FeedbackService } from './feedback.service';

const CREATED = new Date('2026-09-28T01:00:00Z');

const feedback = (overrides: Partial<Feedback> = {}): Feedback =>
  ({
    id: 5,
    userId: 1,
    user: {
      id: 1,
      nickname: '독자',
      handle: 'reader',
      email: 'reader@example.com',
    } as User,
    type: FeedbackType.BOOK_REQUEST,
    content: '신간이에요',
    details: {
      bookTitle: '급류',
      bookAuthor: '정대건',
      pagePath: '/book/search?q=급류',
      userAgent: 'Mozilla/5.0',
    },
    status: FeedbackStatus.RECEIVED,
    reply: null,
    repliedAt: null,
    adminNote: '적재 도구로 확인',
    createdAt: CREATED,
    updatedAt: CREATED,
    ...overrides,
  }) as Feedback;

describe('FeedbackService 조회·운영자 처리', () => {
  let service: FeedbackService;
  let repo: { find: jest.Mock; findOne: jest.Mock; save: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      save: jest.fn((value: Feedback) => Promise.resolve(value)),
    };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: getRepositoryToken(Feedback), useValue: repo },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(FeedbackService);
  });

  describe('findMine', () => {
    it('본인 문의만 보고, 운영자 메모·기기 정보는 담지 않는다', async () => {
      repo.find.mockResolvedValue([feedback()]);

      const { items } = await service.findMine(1);

      expect(repo.find.mock.calls[0][0].where).toEqual({ userId: 1 });
      expect(items[0]).toEqual({
        id: 5,
        type: FeedbackType.BOOK_REQUEST,
        status: FeedbackStatus.RECEIVED,
        content: '신간이에요',
        book: { title: '급류', author: '정대건', publisher: null },
        reply: null,
        repliedAt: null,
        createdAt: CREATED.toISOString(),
      });
    });

    it('한 페이지보다 많으면 마지막 항목 id를 다음 커서로 준다', async () => {
      const rows = Array.from({ length: FEEDBACK_LIST_LIMIT + 1 }, (_, i) =>
        feedback({ id: 100 - i }),
      );
      repo.find.mockResolvedValue(rows);

      const { items, nextCursor } = await service.findMine(1);

      expect(items).toHaveLength(FEEDBACK_LIST_LIMIT);
      expect(nextCursor).toBe(100 - (FEEDBACK_LIST_LIMIT - 1));
    });

    it('마지막 페이지면 커서가 없다', async () => {
      repo.find.mockResolvedValue([feedback()]);

      expect((await service.findMine(1)).nextCursor).toBeNull();
    });
  });

  describe('findForAdmin', () => {
    it('상태·종류로 거르고 작성자 이메일은 내보내지 않는다', async () => {
      repo.find.mockResolvedValue([feedback()]);

      const { items } = await service.findForAdmin({
        status: FeedbackStatus.RECEIVED,
        type: FeedbackType.BOOK_REQUEST,
      });

      expect(repo.find.mock.calls[0][0].where).toEqual({
        status: FeedbackStatus.RECEIVED,
        type: FeedbackType.BOOK_REQUEST,
      });
      expect(items[0].user).toEqual({
        id: 1,
        nickname: '독자',
        handle: 'reader',
      });
      expect(JSON.stringify(items[0])).not.toContain('reader@example.com');
      expect(items[0]).toMatchObject({
        pagePath: '/book/search?q=급류',
        userAgent: 'Mozilla/5.0',
        adminNote: '적재 도구로 확인',
      });
    });
  });

  describe('updateByAdmin', () => {
    it('답변을 새로 달면 시각을 남기고 작성자 알림 이벤트를 낸다', async () => {
      repo.findOne.mockResolvedValue(feedback());

      const result = await service.updateByAdmin(5, {
        reply: '  넣어 두었어요. 검색해 보세요.  ',
        status: FeedbackStatus.DONE,
      });

      expect(result.reply).toBe('넣어 두었어요. 검색해 보세요.');
      expect(result.repliedAt).not.toBeNull();
      expect(result.status).toBe(FeedbackStatus.DONE);
      expect(eventEmitter.emit).toHaveBeenCalledWith('feedback.replied', {
        feedbackId: 5,
        userId: 1,
        type: FeedbackType.BOOK_REQUEST,
        bookTitle: '급류',
      });
    });

    it('같은 답변을 다시 저장하면 알림을 또 보내지 않는다', async () => {
      const repliedAt = new Date('2026-09-28T02:00:00Z');
      repo.findOne.mockResolvedValue(
        feedback({ reply: '넣어 두었어요.', repliedAt }),
      );

      const result = await service.updateByAdmin(5, {
        reply: '넣어 두었어요.',
      });

      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(result.repliedAt).toBe(repliedAt.toISOString());
    });

    it('답변을 비우면 지우고 알림을 보내지 않는다', async () => {
      repo.findOne.mockResolvedValue(
        feedback({ reply: '잘못 쓴 답변', repliedAt: new Date() }),
      );

      const result = await service.updateByAdmin(5, { reply: '   ' });

      expect(result.reply).toBeNull();
      expect(result.repliedAt).toBeNull();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('상태·메모만 바꾸면 알림을 보내지 않는다', async () => {
      repo.findOne.mockResolvedValue(feedback());

      const result = await service.updateByAdmin(5, {
        status: FeedbackStatus.IN_PROGRESS,
        adminNote: '',
      });

      expect(result.status).toBe(FeedbackStatus.IN_PROGRESS);
      expect(result.adminNote).toBeNull();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('탈퇴한 작성자에게는 알림을 보내지 않는다', async () => {
      repo.findOne.mockResolvedValue(feedback({ userId: null, user: null }));

      await service.updateByAdmin(5, { reply: '답변' });

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('없는 문의면 404', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.updateByAdmin(99, { reply: '답변' }),
      ).rejects.toMatchObject({ errorCode: 'FEEDBACK_NOT_FOUND' });
    });
  });
});
