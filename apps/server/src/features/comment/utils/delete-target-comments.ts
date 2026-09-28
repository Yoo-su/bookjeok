import { EntityManager, In } from 'typeorm';

import { Comment, CommentTargetType } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';

/**
 * 대상(리뷰 등)이 사라질 때 거기 달린 댓글과 댓글 좋아요를 함께 지웁니다.
 *
 * 댓글은 대상을 외래키 없이 문자열로만 참조해 DB가 대신 정리해 주지 않습니다.
 * 남겨 두면 "내 댓글"에서 제목 없는 항목이 404로 이어집니다.
 * 좋아요는 CASCADE에 기대지 않고 먼저 지웁니다(운영 스키마와 엔티티가 어긋난 전례가 있음).
 * @param manager 호출한 쪽의 트랜잭션
 * @param targetType 대상 종류
 * @param targetIds 대상 ID 목록 (댓글에 저장된 문자열 형태)
 */
export async function deleteTargetComments(
  manager: EntityManager,
  targetType: CommentTargetType,
  targetIds: string[],
): Promise<void> {
  if (targetIds.length === 0) return;

  const comments = await manager.find(Comment, {
    where: { targetType, targetId: In(targetIds) },
    select: ['id'],
  });
  if (comments.length === 0) return;

  const commentIds = comments.map((comment) => comment.id);
  await manager.delete(CommentLike, { commentId: In(commentIds) });
  await manager.delete(Comment, { id: In(commentIds) });
}
