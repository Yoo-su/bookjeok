import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Book } from '@/features/book/entities/book.entity';
import { User } from '@/features/user/entities/user.entity';

import { ReviewReaction } from './review-reaction.entity';
import { Tag } from './tag.entity';

@Entity('reviews')
// 목록 정렬은 createdAt이 아니라 id 역순이다. 사이에 createdAt이 끼어 있으면
// 정렬에 못 쓴다.
@Index('IDX_reviews_category_isPublic_id', ['category', 'isPublic', 'id'])
@Index('IDX_reviews_isbn', ['isbn'])
@Index('IDX_reviews_userId', ['userId'])
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  category: string;

  @Column('text')
  content: string;

  @Column('float', { default: 0 })
  rating: number;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  reactionCount: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  isbn: string;

  @ManyToOne(() => Book)
  @JoinColumn({ name: 'isbn' })
  book: Book;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ default: true })
  isPublic: boolean;

  @OneToMany(() => ReviewReaction, (reaction) => reaction.review)
  reactions: ReviewReaction[];

  @ManyToMany(() => Tag, { cascade: ['insert'] })
  @JoinTable({
    name: 'review_tags',
    joinColumn: { name: 'reviewId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tagEntities: Tag[];
}
