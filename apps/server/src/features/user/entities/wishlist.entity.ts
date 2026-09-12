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

import { Book } from '@/features/book/entities/book.entity';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';

import { User } from './user.entity';

@Entity({ name: 'wishlists' })
// 한 유저가 같은 책이나 판매글을 중복해서 찜할 수 없도록 유니크 제약조건 설정
@Unique('UQ_wishlists_userId_isbn', ['user', 'book'])
@Unique('UQ_wishlists_userId_usedBookSaleId', ['user', 'usedBookSale'])
// countUniqueWishlistUsers(isbn)가 도서 상세마다 isbn으로 센다.
// usedBookSaleId는 유니크의 두 번째 컬럼이라 선행이 아니어서 따로 필요하다.
@Index('IDX_wishlists_isbn', ['isbn'])
@Index('IDX_wishlists_usedBookSaleId', ['usedBookSale'])
export class Wishlist {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  isbn: string | null;

  @ManyToOne(() => Book, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'isbn' })
  book: Book | null;

  @ManyToOne(() => UsedBookSale, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usedBookSaleId' })
  usedBookSale: UsedBookSale | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
