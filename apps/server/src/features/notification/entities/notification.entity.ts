import { type NotificationMetadata, NotificationType } from '@bookjeok/core';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '@/features/user/entities/user.entity';

@Entity('notifications')
// 목록은 recipientId로 거르고 id 커서로 넘긴다. 안 읽음 개수는 isRead까지 본다.
@Index('idx_notifications_recipient_id', ['recipientId', 'id'])
@Index('idx_notifications_recipient_is_read', ['recipientId', 'isRead'])
@Index('IDX_notifications_actorId', ['actorId'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  recipientId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column({ nullable: true })
  actorId: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'jsonb', default: {} })
  metadata: NotificationMetadata;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
