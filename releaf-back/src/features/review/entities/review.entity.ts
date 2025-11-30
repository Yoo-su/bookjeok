import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Book } from '@/features/book/entities/book.entity';
import { User } from '@/features/user/entities/user.entity';
import { ReviewReaction } from './review-reaction.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  category: string;

  @Column('text')
  content: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column('float', { default: 0 })
  rating: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  bookIsbn: string;

  @ManyToOne(() => Book)
  @JoinColumn({ name: 'bookIsbn' })
  book: Book;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ReviewReaction, (reaction) => reaction.review)
  reactions: ReviewReaction[];
}
