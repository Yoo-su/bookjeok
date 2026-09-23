import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Notification,
  NotificationType,
} from '../entities/notification.entity';
import { NotificationGateway } from '../gateways/notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * 알림을 생성하고 데이터베이스에 저장합니다.
   * 저장 후 실시간 게이트웨이를 통해 수신자에게 즉시 전송합니다.
   *
   * @param recipientId 수신자 ID
   * @param actorId 행위자(알림 유발자) ID
   * @param type 알림 유형
   * @param metadata 알림 메타데이터 (JSON)
   * @returns 저장된 알림 엔티티
   */
  async createNotification(
    recipientId: number,
    actorId: number,
    type: NotificationType,
    metadata: Record<string, unknown>,
  ) {
    if (recipientId === actorId) return;

    const notification = this.notificationRepository.create({
      recipient: { id: recipientId },
      actor: { id: actorId },
      type,
      metadata,
    });

    const saved = await this.notificationRepository.save(notification);

    const populatedNotification = await this.notificationRepository.findOne({
      where: { id: saved.id },
      relations: ['actor'],
    });

    if (populatedNotification) {
      this.notificationGateway.sendNotification(
        recipientId,
        populatedNotification,
      );
    }

    return saved;
  }

  /**
   * 사용자의 알림 목록을 커서 기반 페이지네이션으로 조회합니다.
   *
   * @param userId 조회할 사용자 ID
   * @param cursor 이전 페이지의 마지막 알림 ID (옵션)
   * @param limit 조회할 개수 (기본값 20)
   * @returns 알림 목록 및 다음 커서
   */
  async getNotifications(userId: number, cursor?: number, limit = 20) {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.actor', 'actor')
      .where('notification.recipientId = :userId', { userId })
      // 커서가 id 기준이므로 정렬도 id로 맞춘다. createdAt으로 정렬하면
      // 동시각에 만들어진 알림들의 순서와 커서 비교 기준이 어긋난다.
      .orderBy('notification.id', 'DESC')
      .take(limit + 1); // 다음 페이지 존재 여부 판별용 초과 조회

    if (cursor) {
      query.andWhere('notification.id < :cursor', { cursor });
    }

    const items = await query.getMany();

    // 초과 조회분은 버리고, 커서는 "이번 페이지의 마지막 항목"으로 잡는다.
    // 버린 항목을 커서로 쓰면 다음 페이지가 그 항목을 건너뛰어 사라진다.
    const hasNextPage = items.length > limit;
    if (hasNextPage) {
      items.pop();
    }

    const nextCursor =
      hasNextPage && items.length > 0 ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
    };
  }

  /**
   * 같은 행위자가 같은 대상으로 보낸 같은 유형의 알림이 이미 있는지 확인합니다.
   * 토글형 반응(리액션 등)을 껐다 켤 때 알림이 반복되지 않게 하는 데 씁니다.
   *
   * @param metadata 대상을 식별하는 메타데이터 일부. jsonb 포함(@>) 비교로 찾습니다.
   */
  async hasNotification(
    recipientId: number,
    actorId: number,
    type: NotificationType,
    metadata: Record<string, unknown>,
  ) {
    return this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.recipientId = :recipientId', { recipientId })
      .andWhere('notification.actorId = :actorId', { actorId })
      .andWhere('notification.type = :type', { type })
      .andWhere('notification.metadata @> CAST(:metadata AS jsonb)', {
        metadata: JSON.stringify(metadata),
      })
      .getExists();
  }

  /**
   * 사용자의 읽지 않은 알림 개수를 반환합니다.
   *
   * @param userId 사용자 ID
   */
  async getUnreadCount(userId: number) {
    return this.notificationRepository.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  /**
   * 특정 알림을 읽음 상태로 변경합니다.
   *
   * @param id 알림 ID
   * @param userId 사용자 ID (권한 확인용)
   */
  async markAsRead(id: number, userId: number) {
    await this.notificationRepository.update(
      { id, recipientId: userId },
      { isRead: true },
    );
  }

  /**
   * 사용자의 모든 알림을 읽음 상태로 변경합니다.
   *
   * @param userId 사용자 ID
   */
  async markAllAsRead(userId: number) {
    await this.notificationRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
  }

  /**
   * 특정 알림을 삭제합니다.
   *
   * @param id 알림 ID
   * @param userId 사용자 ID (권한 확인용)
   */
  async remove(id: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id, recipientId: userId },
    });

    if (!notification) {
      return;
    }

    await this.notificationRepository.remove(notification);
  }
}
