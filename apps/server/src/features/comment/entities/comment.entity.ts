import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
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
// 목록은 (targetType, targetId)로 거른 뒤 항상 id 역순이다. id를 끝에 두어야
// 정렬까지 인덱스가 받는다.
@Index('IDX_comments_targetType_targetId_id', ['targetType', 'targetId', 'id'])
@Index('IDX_comments_userId', ['userId'])
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

  @Column({ nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ default: 0 })
  likeCount: number; // 비정규화: 좋아요 수 캐싱

  @OneToMany(() => CommentLike, (like) => like.comment)
  likes: CommentLike[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
