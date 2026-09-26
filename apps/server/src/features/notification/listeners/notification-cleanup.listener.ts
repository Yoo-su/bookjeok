import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from 'typeorm';

import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationCleanupListener {
  private readonly logger = new Logger(NotificationCleanupListener.name);

  /**
   * 유저 탈퇴 시 해당 유저가 수신한 모든 알림(Notification) 데이터를 일괄 물리 삭제합니다.
   */
  // 기본값(true)은 에러를 삼켜 탈퇴 트랜잭션 롤백 불가
  @OnEvent('user.withdrawn', { suppressErrors: false })
  async handleUserWithdrawn(event: {
    userId: number;
    entityManager: EntityManager;
  }) {
    const { userId, entityManager } = event;

    try {
      await entityManager.delete(Notification, { recipientId: userId });
    } catch (error) {
      this.logger.error(
        `Failed to clean up notifications for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // 트랜잭션 롤백 유도
    }
  }
}
