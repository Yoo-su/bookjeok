import { type NotificationMetadata, NotificationType } from '@bookjeok/core';
import { ApiProperty } from '@nestjs/swagger';

import { User } from '@/features/user/entities/user.entity';

export class NotificationResponseDto {
  @ApiProperty({ description: '알림 ID' })
  id: number;

  @ApiProperty({ description: '알림 수신자 ID' })
  recipientId: number;

  @ApiProperty({ description: '알림 유발자 ID', nullable: true })
  actorId: number;

  @ApiProperty({
    description: '알림 유발자 정보',
    type: () => User,
    nullable: true,
  })
  actor?: User;

  @ApiProperty({ description: '알림 타입', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({
    description: '메타데이터 (JSON)',
    example: { reviewId: 1, content: '...' },
  })
  metadata: NotificationMetadata;

  @ApiProperty({ description: '읽음 여부' })
  isRead: boolean;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;
}

export class GetNotificationsResponseDto {
  @ApiProperty({ description: '알림 목록', type: [NotificationResponseDto] })
  items: NotificationResponseDto[];

  @ApiProperty({ description: '다음 커서 ID', nullable: true })
  nextCursor: number | null;
}
