import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityManager, In } from 'typeorm';

import { SaleStatus, UsedBookSale } from '../entities/used-book-sale.entity';

@Injectable()
export class UsedBookSaleCleanupListener {
  private readonly logger = new Logger(UsedBookSaleCleanupListener.name);

  /**
   * 유저 탈퇴 시 해당 유저의 활성 판매글(판매중, 예약중)을 WITHDRAWN(탈퇴숨김)으로 업데이트합니다.
   * 이미 판매 완료(SOLD)된 내역은 구매자의 거래 기록 및 통계 보존을 위해 유지합니다.
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
        UsedBookSale,
        {
          user: { id: userId },
          status: In([SaleStatus.FOR_SALE, SaleStatus.RESERVED]),
        },
        {
          status: SaleStatus.WITHDRAWN,
          reservedForUserId: null,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to clean up used book sales for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error; // 트랜잭션 롤백 유도
    }
  }
}
