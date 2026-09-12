import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '@/features/user/entities/user.entity';

import { TradeCompletion } from './trade-completion.entity';

/**
 * 거래 후기.
 *
 * 결제(Order)가 아니라 거래 완료(TradeCompletion)에 붙습니다. 후기를 주문에
 * 매달아 두면 결제를 거치지 않는 직거래에서는 후기 자체를 남길 수 없습니다.
 *
 * 한 거래당 양쪽이 각각 한 건씩 쓸 수 있습니다.
 */
@Entity({ name: 'trade_reviews' })
@Index('IDX_trade_reviews_targetUserId_createdAt', [
  'targetUserId',
  'createdAt',
])
@Index('IDX_trade_reviews_reviewerId', ['reviewerId'])
@Unique('UQ_trade_reviews_completionId_reviewerId', [
  'completionId',
  'reviewerId',
])
export class TradeReview {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TradeCompletion, (completion) => completion.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'completionId' })
  completion: TradeCompletion;

  @Column()
  completionId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @Column()
  reviewerId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetUserId' })
  targetUser: User;

  @Column()
  targetUserId: number;

  @Column('simple-array')
  tags: string[];

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
