import { FeedbackStatus, FeedbackType } from '@bookjeok/core';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '@/features/user/entities/user.entity';

/** 종류별 부가 정보. 칸이 종류마다 달라 jsonb로 둔다 */
export interface FeedbackDetails {
  bookTitle?: string;
  bookAuthor?: string;
  bookPublisher?: string;
  pagePath?: string;
  userAgent?: string;
}

/**
 * 사용자 문의·제보
 * - 운영자만 본다. 공개 목록 없음
 */
@Entity({ name: 'feedbacks' })
export class Feedback {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_feedbacks_id' })
  id: number;

  /** 작성자가 탈퇴하면 null */
  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({
    name: 'userId',
    foreignKeyConstraintName: 'FK_feedbacks_userId',
  })
  user: User | null;

  @Column({ type: 'varchar', length: 20 })
  type: FeedbackType;

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ type: 'jsonb', default: {} })
  details: FeedbackDetails;

  @Column({ type: 'varchar', length: 20, default: FeedbackStatus.RECEIVED })
  status: FeedbackStatus;

  /** 작성자에게 보이는 운영자 답변 */
  @Column({ type: 'text', nullable: true })
  reply: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  repliedAt: Date | null;

  /** 운영자만 보는 메모 */
  @Column({ type: 'text', nullable: true })
  adminNote: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
