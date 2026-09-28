import { FEEDBACK_DAILY_LIMIT, FeedbackType } from '@bookjeok/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { BusinessException } from '@/shared/exceptions/business.exception';

import { Feedback } from '../entities/feedback.entity';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let repo: { create: jest.Mock; save: jest.Mock; count: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    repo = {
      create: jest.fn((value: Partial<Feedback>) => value),
      save: jest.fn((value: Partial<Feedback>) =>
        Promise.resolve({ ...value, id: 7 }),
      ),
      count: jest.fn().mockResolvedValue(0),
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

  it('책 요청은 책 정보를 details에 담고 내용 없이도 접수한다', async () => {
    const result = await service.create(
      1,
      {
        type: FeedbackType.BOOK_REQUEST,
        bookTitle: '급류',
        bookAuthor: '정대건',
        pagePath: '/book/search?q=급류',
      },
      'Mozilla/5.0',
    );

    expect(result).toEqual({ id: 7 });
    expect(repo.create).toHaveBeenCalledWith({
      userId: 1,
      type: FeedbackType.BOOK_REQUEST,
      content: '',
      details: {
        bookTitle: '급류',
        bookAuthor: '정대건',
        bookPublisher: undefined,
        pagePath: '/book/search?q=급류',
        userAgent: 'Mozilla/5.0',
      },
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith('feedback.created', {
      feedbackId: 7,
    });
  });

  it('책 요청이 아니면 책 정보는 버린다', async () => {
    await service.create(1, {
      type: FeedbackType.BUG,
      content: '버튼이 안 눌려요',
      bookTitle: '급류',
    });

    const saved = repo.create.mock.calls[0][0] as Feedback;
    expect(saved.details.bookTitle).toBeUndefined();
  });

  it('책 요청에 제목이 없으면 거부한다', async () => {
    await expect(
      service.create(1, { type: FeedbackType.BOOK_REQUEST, content: '신간' }),
    ).rejects.toMatchObject({ errorCode: 'FEEDBACK_BOOK_TITLE_REQUIRED' });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it.each([FeedbackType.BUG, FeedbackType.SUGGESTION, FeedbackType.OTHER])(
    '%s에 내용이 없으면 거부한다',
    async (type) => {
      await expect(service.create(1, { type, content: '' })).rejects.toThrow(
        BusinessException,
      );
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    },
  );

  it('User-Agent는 300자로 자른다', async () => {
    await service.create(
      1,
      { type: FeedbackType.OTHER, content: '문의' },
      'a'.repeat(1000),
    );

    const saved = repo.create.mock.calls[0][0] as Feedback;
    expect(saved.details.userAgent).toHaveLength(300);
  });

  it('24시간 안에 한도만큼 보냈으면 거부하고 저장·알림하지 않는다', async () => {
    repo.count.mockResolvedValue(FEEDBACK_DAILY_LIMIT);

    await expect(
      service.create(1, { type: FeedbackType.OTHER, content: '문의' }),
    ).rejects.toMatchObject({ errorCode: 'FEEDBACK_DAILY_LIMIT_EXCEEDED' });
    expect(repo.save).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('한도는 그 사용자의 최근 24시간만 센다', async () => {
    const before = Date.now();
    await service.create(3, { type: FeedbackType.OTHER, content: '문의' });

    const { where } = repo.count.mock.calls[0][0] as {
      where: { userId: number; createdAt: { value: Date } };
    };
    expect(where.userId).toBe(3);
    const since = where.createdAt.value.getTime();
    expect(before - since).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 50);
    expect(before - since).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 50);
  });
});
