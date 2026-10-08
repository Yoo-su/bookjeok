import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';

import { CreateReviewDto } from '@/features/review/dtos/create-review.dto';
import { UpdateReviewDto } from '@/features/review/dtos/update-review.dto';
import { Review } from '@/features/review/entities/review.entity';
import { ReviewReaction } from '@/features/review/entities/review-reaction.entity';
import { ReviewImageHelper } from '@/features/review/helpers/review-image.helper';
import { ReviewService } from '@/features/review/services/review.service';

let mockCommitFails = false;
const mockOrder: string[] = [];

// DB 커밋 실패를 재현한다. 저장이 성공했어도 decorator가 거부하면 알림은 없어야 한다.
jest.mock('@nestjs-cls/transactional', () => ({
  ...jest.requireActual<Record<string, unknown>>('@nestjs-cls/transactional'),
  Transactional:
    () =>
    (
      _target: unknown,
      _key: string,
      descriptor: TypedPropertyDescriptor<
        (...args: never[]) => Promise<unknown>
      >,
    ) => {
      const original = descriptor.value!;
      descriptor.value = async function (this: unknown, ...args: never[]) {
        const result: unknown = await original.apply(this, args);
        if (mockCommitFails) throw new Error('commit failed');
        mockOrder.push('commit');
        return result;
      };
      return descriptor;
    },
}));

describe('ReviewService indexing after commit', () => {
  let service: ReviewService;
  let review: Review;
  let emit: jest.Mock;
  let save: jest.Mock;
  let deleteImages: jest.Mock;

  beforeEach(async () => {
    mockCommitFails = false;
    mockOrder.length = 0;
    review = Object.assign(new Review(), {
      id: 42,
      userId: 7,
      isPublic: true,
      content: '<p>old</p>',
      tagEntities: [],
    });
    emit = jest.fn().mockImplementation(() => {
      mockOrder.push('event');
      return true;
    });
    save = jest
      .fn()
      .mockImplementation((_entity: unknown, saved: Review) =>
        Promise.resolve(saved),
      );
    deleteImages = jest.fn().mockImplementation(() => {
      mockOrder.push('images');
      return Promise.resolve();
    });
    const manager = {
      create: jest.fn().mockReturnValue(review),
      save,
      findOne: jest.fn().mockResolvedValue(review),
      find: jest.fn().mockResolvedValue([]),
      remove: jest
        .fn()
        .mockImplementation((_entity: unknown, deleted: Review) => {
          deleted.id = undefined!;
          return Promise.resolve(deleted);
        }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const module = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: getRepositoryToken(Review), useValue: {} },
        { provide: getRepositoryToken(ReviewReaction), useValue: {} },
        { provide: TransactionHost, useValue: { tx: manager } },
        { provide: EventEmitter2, useValue: { emit } },
        {
          provide: ReviewImageHelper,
          useValue: {
            getRemovedImages: jest
              .fn()
              .mockReturnValue(['https://image.test/a.png']),
            extractImageUrls: jest
              .fn()
              .mockReturnValue(['https://image.test/a.png']),
            deleteImages,
          },
        },
      ],
    }).compile();
    service = module.get(ReviewService);
  });

  it('생성은 커밋 뒤에 변경을 발행한다', async () => {
    await service.create(
      Object.assign(new CreateReviewDto(), { isbn: '9788937461309' }),
      7,
    );
    expect(mockOrder).toEqual(['commit', 'event']);
    expect(emit).toHaveBeenCalledWith('review.changed', {
      reviewId: 42,
      isPublic: true,
      wasPublic: false,
    });
  });

  it('공개→비공개 전환의 이전 상태를 보존하고 이미지 삭제보다 먼저 발행한다', async () => {
    await service.update(
      42,
      Object.assign(new UpdateReviewDto(), {
        isPublic: false,
        content: '<p>new</p>',
      }),
      7,
    );
    expect(mockOrder).toEqual(['commit', 'event', 'images']);
    expect(emit).toHaveBeenCalledWith('review.changed', {
      reviewId: 42,
      isPublic: false,
      wasPublic: true,
    });
  });

  it('TypeORM remove가 id를 지워도 기존 공개 URL id를 발행한다', async () => {
    await service.remove(42, 7);
    expect(mockOrder).toEqual(['commit', 'event', 'images']);
    expect(emit).toHaveBeenCalledWith('review.changed', {
      reviewId: 42,
      isPublic: false,
      wasPublic: true,
    });
  });

  it.each(['create', 'update', 'remove'] as const)(
    '%s 커밋이 실패하면 알림과 이미지 삭제가 없다',
    async (operation) => {
      mockCommitFails = true;
      const action =
        operation === 'create'
          ? service.create(new CreateReviewDto(), 7)
          : operation === 'update'
            ? service.update(
                42,
                Object.assign(new UpdateReviewDto(), { content: '<p>new</p>' }),
                7,
              )
            : service.remove(42, 7);
      await expect(action).rejects.toThrow('commit failed');
      expect(save.mock.calls.length).toBe(operation === 'remove' ? 0 : 1);
      expect(emit).not.toHaveBeenCalled();
      expect(deleteImages).not.toHaveBeenCalled();
    },
  );
});
