import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Book } from '@/features/book/entities/book.entity';
import { UsedBookSale } from '@/features/book/entities/used-book-sale.entity';

@Entity({ name: 'wishlists' })
// 한 유저가 같은 책이나 판매글을 중복해서 찜할 수 없도록 유니크 제약조건 설정
@Unique(['user', 'book'])
@Unique(['user', 'usedBookSale'])
export class Wishlist {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Book, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookIsbn' })
  book: Book | null;

  @ManyToOne(() => UsedBookSale, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usedBookSaleId' })
  usedBookSale: UsedBookSale | null;

  @CreateDateColumn()
  createdAt: Date;
}
