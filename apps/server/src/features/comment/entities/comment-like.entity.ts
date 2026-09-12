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

import { Comment } from './comment.entity';

/**
 * 댓글 좋아요 Entity
 * 사용자당 댓글당 최대 1개의 좋아요만 허용
 */
@Entity('comment_likes')
@Unique(['commentId', 'userId']) // 중복 좋아요 방지
// 위 유니크는 userId가 선행이 아니라 탈퇴 시 CASCADE를 받아주지 못한다.
@Index('IDX_comment_likes_userId', ['userId'])
export class CommentLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  commentId: number;

  @ManyToOne(() => Comment, (comment) => comment.likes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
