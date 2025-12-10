import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UsedBookSale } from './used-book-sale.entity';

@Entity({ name: 'books' })
export class Book {
  @PrimaryColumn()
  isbn: string;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column()
  publisher: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  image: string;

  @OneToMany(() => UsedBookSale, (sale) => sale.book)
  usedBookSales: UsedBookSale[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
