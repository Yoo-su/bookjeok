import { Injectable, Logger } from '@nestjs/common';

import {
  UserWithdrawnEvent,
  userWithdrawnEvent,
} from '@/features/user/events/user-withdrawn.event';
import { OnDomainEvent } from '@/shared/events/domain-event';

import { Feedback } from '../entities/feedback.entity';

@Injectable()
export class FeedbackCleanupListener {
  private readonly logger = new Logger(FeedbackCleanupListener.name);

  /**
   * 유저 탈퇴 시 문의는 남기고 작성자 연결만 끊습니다.
   */
  // 기본값(true)은 에러를 삼켜 탈퇴 트랜잭션 롤백 불가
  @OnDomainEvent(userWithdrawnEvent, { suppressErrors: false })
  async handleUserWithdrawn(event: UserWithdrawnEvent) {
    const { userId, entityManager } = event;

    try {
      await entityManager.update(Feedback, { userId }, { userId: null });
    } catch (error) {
      this.logger.error(
        `Failed to anonymize feedback for user ${userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error; // 트랜잭션 롤백 유도
    }
  }
}
