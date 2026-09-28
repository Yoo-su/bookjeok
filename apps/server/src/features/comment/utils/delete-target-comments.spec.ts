import { EntityManager, In } from 'typeorm';

import { ReviewCleanupListener } from '@/features/review/listeners/review-cleanup.listener';

import { Comment, CommentTargetType } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { deleteTargetComments } from './delete-target-comments';

const makeManager = (found: Partial<Record<string, unknown[]>> = {}) =>
  ({
    find: jest.fn((entity: { name: string }) =>
      Promise.resolve(found[entity.name] ?? []),
    ),
    delete: jest.fn().mockResolvedValue({ affected: 0 }),
    decrement: jest.fn().mockResolvedValue(undefined),
  }) as unknown as EntityManager & {
    find: jest.Mock;
    delete: jest.Mock;
  };

describe('deleteTargetComments', () => {
  it('대상의 댓글 좋아요를 먼저, 댓글을 다음에 지운다', async () => {
    const manager = makeManager({ Comment: [{ id: 3 }, { id: 5 }] });

    await deleteTargetComments(manager, CommentTargetType.REVIEW, ['12']);

    expect(manager.find).toHaveBeenCalledWith(Comment, {
      where: { targetType: CommentTargetType.REVIEW, targetId: In(['12']) },
      select: ['id'],
    });
    expect(manager.delete.mock.calls).toEqual([
      [CommentLike, { commentId: In([3, 5]) }],
      [Comment, { id: In([3, 5]) }],
    ]);
  });

  it('대상이 없거나 댓글이 없으면 삭제하지 않는다', async () => {
    const manager = makeManager();

    await deleteTargetComments(manager, CommentTargetType.REVIEW, []);
    expect(manager.find).not.toHaveBeenCalled();

    await deleteTargetComments(manager, CommentTargetType.REVIEW, ['12']);
    expect(manager.delete).not.toHaveBeenCalled();
  });
});

describe('ReviewCleanupListener', () => {
  it('탈퇴 회원의 리뷰를 지우기 전에 거기 달린 댓글을 지운다', async () => {
    const manager = makeManager({
      Review: [{ id: 12 }, { id: 13 }],
      Comment: [{ id: 3 }],
    });

    await new ReviewCleanupListener().handleUserWithdrawn({
      userId: 1,
      entityManager: manager,
    });

    expect(manager.find).toHaveBeenCalledWith(Comment, {
      where: {
        targetType: CommentTargetType.REVIEW,
        targetId: In(['12', '13']),
      },
      select: ['id'],
    });
    const deletedEntities = manager.delete.mock.calls.map(
      ([entity]) => (entity as { name: string }).name,
    );
    expect(deletedEntities.indexOf('Comment')).toBeLessThan(
      deletedEntities.indexOf('Review'),
    );
  });
});
