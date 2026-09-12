import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { User } from '@/features/user/entities/user.entity';

import { Review } from './review.entity';

export enum ReviewReactionType {
  LIKE = 'LIKE',
  INSIGHTFUL = 'INSIGHTFUL',
  SUPPORT = 'SUPPORT',
}

@Entity('review_reactions')
@Unique(['reviewId', 'userId'])
// 위 유니크는 userId가 선행이 아니라 탈퇴 시 CASCADE를 받아주지 못한다.
@Index('IDX_review_reactions_userId', ['userId'])
export class ReviewReaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reviewId: number;

  @ManyToOne(() => Review, (review) => review.reactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reviewId' })
  review: Review;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: ReviewReactionType,
  })
  type: ReviewReactionType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
