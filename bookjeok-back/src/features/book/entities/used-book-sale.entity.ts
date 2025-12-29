import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@/features/user/entities/user.entity';
import { Book } from './book.entity';
import { ChatRoom } from '@/features/chat/entities/chat-room.entity';

export enum SaleStatus {
  FOR_SALE = 'FOR_SALE', // 판매중
  RESERVED = 'RESERVED', // 예약중
  SOLD = 'SOLD', // 판매완료
  WITHDRAWN = 'WITHDRAWN', // 탈퇴로 인한 숨김
}

@Entity({ name: 'used_book_sales' })
export class UsedBookSale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  price: number;

  @Column()
  city: string;

  @Column()
  district: string;

  @Column({ type: 'double precision' })
  latitude: number;

  @Column({ type: 'double precision' })
  longitude: number;

  @Column()
  placeName: string;

  @Column('text')
  content: string;

  @Column('simple-array')
  imageUrls: string[];

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.FOR_SALE,
  })
  status: SaleStatus;

  @Column({ default: 0 })
  viewCount: number;

  @ManyToOne(() => User, (user) => user.usedBookSales, {
    onDelete: 'CASCADE', // 유저가 삭제되면 판매글도 함께 삭제
  })
  @JoinColumn({ name: 'userId' }) // 외래 키 컬럼명을 'userId'로 명시
  user: User;

  @ManyToOne(() => Book, (book) => book.usedBookSales, {
    eager: true, // 판매글 조회 시 항상 책 정보도 함께 로드
    onDelete: 'SET NULL', // 책 마스터 정보가 삭제되더라도 판매글은 유지 (null로 설정)
  })
  @JoinColumn({ name: 'bookIsbn' }) // 외래 키 컬럼명을 'bookIsbn'로 명시
  book: Book;

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    type: 'timestamptz',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // 하나의 판매글은 여러개의 채팅방을 가질 수 있습니다.
  @OneToMany(() => ChatRoom, (chatRoom) => chatRoom.usedBookSale)
  chatRooms: ChatRoom[];
}
