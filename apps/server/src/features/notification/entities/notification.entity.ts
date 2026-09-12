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

export enum NotificationType {
  REVIEW_REACTION = 'REVIEW_REACTION',
  REVIEW_COMMENT = 'REVIEW_COMMENT',
  COMMENT_LIKE = 'COMMENT_LIKE',
  // 중고거래 관련 알림
  BUYER_SELECTED = 'BUYER_SELECTED',
  OTHER_BUYER_TRADING = 'OTHER_BUYER_TRADING',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_EXPIRED = 'PAYMENT_EXPIRED',
  SHIPPING_STARTED = 'SHIPPING_STARTED',
  DELIVERY_COMPLETED = 'DELIVERY_COMPLETED',
  AUTO_CONFIRM_IMMINENT = 'AUTO_CONFIRM_IMMINENT',
  PURCHASE_CONFIRMED = 'PURCHASE_CONFIRMED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  SHIPPING_DEADLINE_IMMINENT = 'SHIPPING_DEADLINE_IMMINENT',
  TRADE_REVIEW_RECEIVED = 'TRADE_REVIEW_RECEIVED',
  // 직거래 (결제 없이 진행되는 거래)
  TRADE_RESERVED = 'TRADE_RESERVED',
  TRADE_COMPLETED = 'TRADE_COMPLETED',
}

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
  metadata: Record<string, unknown>;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
