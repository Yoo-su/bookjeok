import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager } from 'typeorm';

import { ChatParticipant } from '../entities/chat-participant.entity';

@Injectable()
export class ChatCleanupListener {
  private readonly logger = new Logger(ChatCleanupListener.name);

  /**
   * 유저 탈퇴 시 해당 유저의 채팅 참여 이력을 비활성화(isActive = false)합니다.
   *
   * 읽음 상태는 참여자 행의 워터마크(lastReadMessageId) 한 칸이라
   * 이 행을 비활성화하는 것으로 함께 정리됩니다. 따로 지울 기록이 없습니다.
   */
  // 기본값(true)은 에러를 삼켜 탈퇴 트랜잭션 롤백 불가
  @OnEvent('user.withdrawn', { suppressErrors: false })
  async handleUserWithdrawn(event: {
    userId: number;
    entityManager: EntityManager;
  }) {
    const { userId, entityManager } = event;

    try {
      await entityManager.update(
        ChatParticipant,
        { user: { id: userId } },
        { isActive: false },
      );
    } catch (error) {
      this.logger.error(
        `Failed to clean up chat resources for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // 트랜잭션 롤백 유도
    }
  }
}
