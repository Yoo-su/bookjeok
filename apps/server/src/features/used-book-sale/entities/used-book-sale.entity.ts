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

import { Book } from '@/features/book/entities/book.entity';
import { ChatRoom } from '@/features/chat/entities/chat-room.entity';
import { User } from '@/features/user/entities/user.entity';

export enum SaleStatus {
  FOR_SALE = 'FOR_SALE', // 판매중
  RESERVED = 'RESERVED', // 예약중
  SOLD = 'SOLD', // 판매완료
  WITHDRAWN = 'WITHDRAWN', // 탈퇴로 인한 숨김
}

export enum TradeMethod {
  DIRECT_ONLY = 'DIRECT_ONLY',
  DELIVERY_ONLY = 'DELIVERY_ONLY',
  BOTH = 'BOTH',
}

@Entity({ name: 'used_book_sales' })
// 이름은 운영에 이미 만들어진 것과 맞춘다.
@Index('IDX_used_book_sales_status_createdAt_id', ['status', 'createdAt', 'id'])
@Index('IDX_used_book_sales_status_price_id', ['status', 'price', 'id'])
// 도서 상세의 "이 책 판매글"과 마이페이지의 "내 판매글"이 각각 타는 경로다.
@Index('IDX_used_book_sales_isbn', ['isbn'])
@Index('IDX_used_book_sales_userId', ['user'])
@Index('IDX_used_book_sales_reservedForUserId', ['reservedForUserId'])
//
// 운영에는 TypeORM 데코레이터로 표현할 수 없는 인덱스가 하나 더 있다.
//   used_book_sales_location_idx: gist (ll_to_earth(latitude, longitude))
// 표현식 인덱스라 여기 선언할 수 없다. 지우지 말 것 (docs/manual-ddl-log.md 8절).
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

  @Column({
    type: 'enum',
    enum: TradeMethod,
    default: TradeMethod.DIRECT_ONLY,
  })
  tradeMethod: TradeMethod;

  @Column({ default: 0 })
  viewCount: number;

  @ManyToOne(() => User, (user) => user.usedBookSales, {
    onDelete: 'CASCADE', // 유저가 삭제되면 판매글도 함께 삭제
  })
  @JoinColumn({ name: 'userId' }) // 외래 키 컬럼명을 'userId'로 명시
  user: User;

  @Column()
  isbn: string;

  @ManyToOne(() => Book, (book) => book.usedBookSales, {
    eager: true, // 판매글 조회 시 항상 책 정보도 함께 로드
    onDelete: 'SET NULL', // 책 마스터 정보가 삭제되더라도 판매글은 유지 (null로 설정)
  })
  @JoinColumn({ name: 'isbn' }) // 외래 키 컬럼명을 'isbn'으로 명시
  book: Book;

  /**
   * 예약중일 때 거래 상대로 지정된 사용자.
   *
   * 예약중은 판매자의 내부 메모가 아니라 다른 구매희망자에게 "이 분과 얘기
   * 중이니 기다려달라"고 보내는 신호다. 그 신호가 성립하려면 상대가 누구인지
   * 남아 있어야 다른 채팅방에 안내를 띄우고, 완료 시 후기 상대를 정할 수 있다.
   *
   * 상대를 지정하지 않고 예약중으로만 바꾸는 것도 허용하므로 nullable이다.
   * 이 경우 판매완료로 넘어가도 후기는 열리지 않는다.
   */
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reservedForUserId' })
  reservedForUser: User | null;

  @Column({ nullable: true })
  reservedForUserId: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // 하나의 판매글은 여러개의 채팅방을 가질 수 있습니다.
  @OneToMany(() => ChatRoom, (chatRoom) => chatRoom.usedBookSale)
  chatRooms: ChatRoom[];

  /**
   * DB 컬럼이 아닌 응답 전용 필드.
   *
   * 활성 주문(결제~배송 단계)이 걸려 있어 수정·삭제·수동 상태 변경이
   * 시스템에 의해 잠긴 판매글인지를 나타냅니다. 클라이언트는 이 값으로
   * 잠금 여부를 판단해야 합니다. `status === RESERVED`로 대신 판단하면
   * 판매자가 직접 예약중으로 바꾼 직거래 건까지 함께 잠깁니다.
   */
  hasActiveOrder?: boolean;

  /**
   * DB 컬럼이 아닌 응답 전용 필드.
   *
   * 거래 완료 기록이 남아 있는지. 기록이 있으면 후기와 신뢰 지표가 그 위에
   * 얹히므로 판매완료를 되돌릴 수 없습니다. 반대로 기록 없이 상태만 판매완료인
   * 글은 오조작일 수 있으니 되돌릴 수 있게 둡니다.
   */
  hasTradeCompletion?: boolean;
}
