import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
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

  @CreateDateColumn()
  createdAt: Date;
}
