import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from 'typeorm';

import { ActivityLog } from '../entities/activity-log.entity';

@Injectable()
export class ActivityCleanupListener {
  private readonly logger = new Logger(ActivityCleanupListener.name);

  /**
   * 유저 탈퇴 시 해당 유저의 활동 기록(ActivityLog) 내의 userId를 null로 업데이트하여 비식별화(익명화) 처리합니다.
   */
  // 기본값(true)은 에러를 삼켜 탈퇴 트랜잭션 롤백 불가
  @OnEvent('user.withdrawn', { suppressErrors: false })
  async handleUserWithdrawn(event: {
    userId: number;
    entityManager: EntityManager;
  }) {
    const { userId, entityManager } = event;

    try {
      await entityManager.update(ActivityLog, { userId }, { userId: null });
    } catch (error) {
      this.logger.error(
        `Failed to clean up activity logs for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // 트랜잭션 롤백 유도
    }
  }
}
