import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from 'typeorm';

import { Wishlist } from '../entities/wishlist.entity';

@Injectable()
export class UserCleanupListener {
  private readonly logger = new Logger(UserCleanupListener.name);

  /**
   * 유저 탈퇴 시 해당 유저의 위시리스트 데이터를 일괄 삭제합니다.
   */
  // 기본값(true)은 에러를 삼켜 탈퇴 트랜잭션 롤백 불가
  @OnEvent('user.withdrawn', { suppressErrors: false })
  async handleUserWithdrawn(event: {
    userId: number;
    entityManager: EntityManager;
  }) {
    const { userId, entityManager } = event;

    try {
      await entityManager.delete(Wishlist, { user: { id: userId } });
    } catch (error) {
      this.logger.error(
        `Failed to clean up wishlist for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // 동일 트랜잭션 내에서 롤백을 유도하기 위해 에러를 다시 전집니다.
    }
  }
}
