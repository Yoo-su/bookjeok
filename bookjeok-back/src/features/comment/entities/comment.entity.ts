import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';

import { User } from '@/features/user/entities/user.entity';
import { CommentLike } from './comment-like.entity';

/**
 * 댓글 타겟 타입
 * BOOK: 도서 상세 페이지 댓글
 * REVIEW: 리뷰 상세 페이지 댓글 (추후 확장)
 */
export enum CommentTargetType {
  BOOK = 'BOOK',
  REVIEW = 'REVIEW',
}

@Entity('comments')
@Index(['targetType', 'targetId']) // 조회 성능 최적화
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: CommentTargetType,
  })
  targetType: CommentTargetType;

  @Column()
  targetId: string; // ISBN 또는 Review ID (문자열로 통일)

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: 0 })
  likeCount: number; // 비정규화: 좋아요 수 캐싱

  @OneToMany(() => CommentLike, (like) => like.comment)
  likes: CommentLike[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
