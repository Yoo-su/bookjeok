import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionHost } from '@nestjs-cls/transactional';

import { ReviewResponseDto } from '../dtos/review-response.dto';
import { Review } from '../entities/review.entity';
import {
  ReviewReaction,
  ReviewReactionType,
} from '../entities/review-reaction.entity';
import { ReviewImageHelper } from '../helpers/review-image.helper';
import { ReviewService } from './review.service';

jest.mock('@nestjs-cls/transactional', () => {
  const actual = jest.requireActual<Record<string, unknown>>(
    '@nestjs-cls/transactional',
  );
  return {
    ...actual,
    Transactional:
      () =>
      (
        _target: unknown,
        _propertyKey: string,
        descriptor: PropertyDescriptor,
      ) =>
        descriptor,
  };
});

const REVIEW_ID = 42;
const USER_ID = 7;

describe('ReviewService.toggleReaction', () => {
  let service: ReviewService;
  let manager: {
    findOne: jest.Mock;
    delete: jest.Mock;
    save: jest.Mock;
    increment: jest.Mock;
    decrement: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let execute: jest.Mock;
  let eventEmitter: { emit: jest.Mock };
  const result = { id: REVIEW_ID } as ReviewResponseDto;

  const givenReaction = (reaction: Partial<ReviewReaction> | null) => {
    manager.findOne.mockImplementation((entity: unknown) =>
      Promise.resolve(
        entity === Review
          ? { id: REVIEW_ID, userId: 1, isPublic: true }
          : reaction,
      ),
    );
  };

  beforeEach(async () => {
    execute = jest.fn().mockResolvedValue({ identifiers: [{ id: 1 }] });
    const qb = {
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute,
    };
    manager = {
      findOne: jest.fn(),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      save: jest.fn().mockResolvedValue({}),
      increment: jest.fn().mockResolvedValue({}),
      decrement: jest.fn().mockResolvedValue({}),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    eventEmitter = { emit: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: getRepositoryToken(Review), useValue: {} },
        { provide: getRepositoryToken(ReviewReaction), useValue: {} },
        { provide: ReviewImageHelper, useValue: {} },
        { provide: TransactionHost, useValue: { tx: manager } },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(ReviewService);
    jest.spyOn(service, 'findOne').mockResolvedValue(result);
  });

  const expectEvent = (isAdded: boolean) =>
    expect(eventEmitter.emit).toHaveBeenCalledWith('review.reacted', {
      review: result,
      actorId: USER_ID,
      isAdded,
    });

  it('처음 반응하면 추가하고 카운트를 올리며 새 반응으로 알린다', async () => {
    givenReaction(null);

    await expect(
      service.toggleReaction(REVIEW_ID, USER_ID, ReviewReactionType.LIKE),
    ).resolves.toBe(result);

    expect(manager.increment).toHaveBeenCalledWith(
      Review,
      { id: REVIEW_ID },
      'reactionCount',
      1,
    );
    expectEvent(true);
  });

  it('같은 종류를 다시 누르면 삭제하고 카운트를 내린다', async () => {
    givenReaction({ id: 3, type: ReviewReactionType.LIKE });

    await service.toggleReaction(REVIEW_ID, USER_ID, ReviewReactionType.LIKE);

    expect(manager.delete).toHaveBeenCalledWith(ReviewReaction, 3);
    expect(manager.decrement).toHaveBeenCalled();
    expectEvent(false);
  });

  it('다른 종류로 바꾸면 카운트는 그대로 두고 새 반응으로 치지 않는다', async () => {
    givenReaction({ id: 3, type: ReviewReactionType.LIKE });

    await service.toggleReaction(
      REVIEW_ID,
      USER_ID,
      ReviewReactionType.INSIGHTFUL,
    );

    expect(manager.save).toHaveBeenCalledWith(
      ReviewReaction,
      expect.objectContaining({ type: ReviewReactionType.INSIGHTFUL }),
    );
    expect(manager.increment).not.toHaveBeenCalled();
    expect(manager.decrement).not.toHaveBeenCalled();
    expectEvent(false);
  });

  it('동시 요청에 밀려 추가가 무시되면 카운트를 올리지 않고 알리지 않는다', async () => {
    givenReaction(null);
    execute.mockResolvedValue({ identifiers: [] });

    await service.toggleReaction(REVIEW_ID, USER_ID, ReviewReactionType.LIKE);

    expect(manager.increment).not.toHaveBeenCalled();
    expectEvent(false);
  });
});
