import { EntityManager, In } from 'typeorm';

import { Review } from '../entities/review.entity';
import { ReviewCleanupListener } from './review-cleanup.listener';

describe('ReviewCleanupListener', () => {
  const listener = new ReviewCleanupListener();

  const createManager = (reactions: { reviewId: number }[]) => {
    const mocks = {
      find: jest.fn().mockResolvedValue(reactions),
      delete: jest.fn(),
      decrement: jest.fn(),
    };
    return { mocks, entityManager: mocks as unknown as EntityManager };
  };

  it('탈퇴 회원이 남긴 리액션만큼 리뷰의 reactionCount를 줄인다', async () => {
    const { mocks, entityManager } = createManager([
      { reviewId: 4 },
      { reviewId: 9 },
    ]);

    await listener.handleUserWithdrawn({ userId: 1, entityManager });

    expect(mocks.decrement).toHaveBeenCalledWith(
      Review,
      { id: In([4, 9]) },
      'reactionCount',
      1,
    );
  });

  it('남긴 리액션이 없으면 reactionCount를 건드리지 않는다', async () => {
    const { mocks, entityManager } = createManager([]);

    await listener.handleUserWithdrawn({ userId: 1, entityManager });

    expect(mocks.decrement).not.toHaveBeenCalled();
  });
});
