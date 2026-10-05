import { Injectable, Logger } from '@nestjs/common';
import { In } from 'typeorm';

import {
  UserWithdrawnEvent,
  userWithdrawnEvent,
} from '@/features/user/events/user-withdrawn.event';
import { OnDomainEvent } from '@/shared/events/domain-event';
import { adjustCounter } from '@/shared/utils/adjust-counter';

import { Comment } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';

@Injectable()
export class CommentCleanupListener {
  private readonly logger = new Logger(CommentCleanupListener.name);

  /**
   * 유저 탈퇴 시 해당 유저가 누른 댓글 좋아요(CommentLike)를 일괄 삭제하고 likeCount를 되돌리며,
   * 작성한 댓글(Comment)의 userId를 null로 일괄 업데이트하여 익명화합니다.
   */
  // 기본값(true)은 에러를 삼켜 탈퇴 트랜잭션 롤백 불가
  @OnDomainEvent(userWithdrawnEvent, { suppressErrors: false })
  async handleUserWithdrawn(event: UserWithdrawnEvent) {
    const { userId, entityManager } = event;

    try {
      // 1. 댓글 좋아요 삭제 (댓글 익명화 전에 처리)
      const likes = await entityManager.find(CommentLike, {
        where: { userId },
        select: ['commentId'],
      });
      await entityManager.delete(CommentLike, { userId });

      // (commentId, userId) 유니크라 댓글당 1 감소
      if (likes.length > 0) {
        await adjustCounter(
          entityManager,
          Comment,
          { id: In(likes.map((like) => like.commentId)) },
          'likeCount',
          -1,
        );
      }

      // 2. 댓글 익명화 (사용자 연결 해제)
      await entityManager.update(Comment, { userId }, { userId: null });
    } catch (error) {
      this.logger.error(
        `Failed to clean up comment resources for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // 트랜잭션 롤백 유도
    }
  }
}
