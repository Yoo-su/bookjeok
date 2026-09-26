import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from 'typeorm';

import { ReadingLog } from '../entities/reading-log.entity';

@Injectable()
export class ReadingLogCleanupListener {
  private readonly logger = new Logger(ReadingLogCleanupListener.name);

  /**
   * 유저 탈퇴 시 해당 유저의 독서 기록(ReadingLog)을 일괄 삭제합니다.
   */
  // 기본값(true)은 에러를 삼켜 탈퇴 트랜잭션 롤백 불가
  @OnEvent('user.withdrawn', { suppressErrors: false })
  async handleUserWithdrawn(event: {
    userId: number;
    entityManager: EntityManager;
  }) {
    const { userId, entityManager } = event;

    try {
      await entityManager.delete(ReadingLog, { userId });
    } catch (error) {
      this.logger.error(
        `Failed to clean up reading logs for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // 트랜잭션 롤백 유도
    }
  }
}
