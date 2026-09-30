import { EntityManager, In } from 'typeorm';

import { adjustCounter } from '@/shared/utils/adjust-counter';

import { Comment } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { CommentCleanupListener } from './comment-cleanup.listener';

jest.mock('@/shared/utils/adjust-counter');

describe('CommentCleanupListener', () => {
  const listener = new CommentCleanupListener();

  beforeEach(() => jest.mocked(adjustCounter).mockClear());

  const createManager = (likes: { commentId: number }[]) => {
    const mocks = {
      find: jest.fn().mockResolvedValue(likes),
      delete: jest.fn(),
      update: jest.fn(),
    };
    return { mocks, entityManager: mocks as unknown as EntityManager };
  };

  it('탈퇴 회원이 누른 좋아요만큼 댓글의 likeCount를 줄인다', async () => {
    const { mocks, entityManager } = createManager([
      { commentId: 3 },
      { commentId: 5 },
    ]);

    await listener.handleUserWithdrawn({ userId: 1, entityManager });

    expect(mocks.delete).toHaveBeenCalledWith(CommentLike, { userId: 1 });
    expect(adjustCounter).toHaveBeenCalledWith(
      entityManager,
      Comment,
      { id: In([3, 5]) },
      'likeCount',
      -1,
    );
    expect(mocks.update).toHaveBeenCalledWith(
      Comment,
      { userId: 1 },
      { userId: null },
    );
  });

  it('누른 좋아요가 없으면 likeCount를 건드리지 않는다', async () => {
    const { entityManager } = createManager([]);

    await listener.handleUserWithdrawn({ userId: 1, entityManager });

    expect(adjustCounter).not.toHaveBeenCalled();
  });
});
