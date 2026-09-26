import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from 'typeorm';

import { AiRequestLog } from '../entities/ai-request-log.entity';

@Injectable()
export class LlmCleanupListener {
  private readonly logger = new Logger(LlmCleanupListener.name);

  /**
   * 유저 탈퇴 시 해당 유저의 AI 요청 로그(AiRequestLog)를 일괄 삭제합니다.
   */
  // 기본값(true)은 에러를 삼켜 탈퇴 트랜잭션 롤백 불가
  @OnEvent('user.withdrawn', { suppressErrors: false })
  async handleUserWithdrawn(event: {
    userId: number;
    entityManager: EntityManager;
  }) {
    const { userId, entityManager } = event;

    try {
      await entityManager.delete(AiRequestLog, { userId });
    } catch (error) {
      this.logger.error(
        `Failed to clean up AI request logs for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // 트랜잭션 롤백 유도
    }
  }
}
