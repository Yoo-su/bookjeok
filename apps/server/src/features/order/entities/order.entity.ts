import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

import { ChatRoom } from '@/features/chat/entities/chat-room.entity';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';
import { User } from '@/features/user/entities/user.entity';

export enum OrderStatus {
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CONFIRMED = 'CONFIRMED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'orders' })
// 이름은 운영에 이미 만들어진 것과 맞춘다.
@Index('IDX_orders_status_expiresAt', ['status', 'expiresAt'])
@Index('IDX_orders_status_deliveredAt', ['status', 'deliveredAt'])
@Index('IDX_orders_status_disputedAt', ['status', 'disputedAt'])
@Index('IDX_orders_buyerId', ['buyerId'])
@Index('IDX_orders_sellerId', ['sellerId'])
// 판매글 상세가 매번 부르는 hasActiveOrder()가 saleId로 찾는다.
@Index('IDX_orders_saleId', ['saleId'])
@Index('IDX_orders_chatRoomId', ['chatRoomId'])
export class Order {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.AWAITING_PAYMENT,
  })
  status: OrderStatus;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  paymentKey: string | null;

  // 배송지 스냅샷
  @Column({ type: 'varchar', nullable: true })
  recipientName: string | null;

  @Column({ type: 'varchar', nullable: true })
  recipientPhone: string | null;

  @Column({ type: 'varchar', nullable: true })
  zipCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true })
  addressDetail: string | null;

  // 배송 정보
  @Column({ type: 'varchar', nullable: true })
  carrier: string | null;

  @Column({ type: 'varchar', nullable: true })
  trackingNumber: string | null;

  // 시각 필드 (timestamptz)
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  shippedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  disputedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  // 사유
  @Column({ type: 'text', nullable: true })
  disputeReason: string | null;

  @Column({ type: 'text', nullable: true })
  cancelReason: string | null;

  // 동시성 제어를 위한 낙관적 락 버전 컬럼
  @VersionColumn()
  version: number;

  // 관계 설정
  @ManyToOne(() => UsedBookSale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: UsedBookSale;

  @Column()
  saleId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @Column()
  buyerId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column()
  sellerId: number;

  @ManyToOne(() => ChatRoom, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'chatRoomId' })
  chatRoom: ChatRoom | null;

  @Column({ nullable: true })
  chatRoomId: number | null;

  /**
   * DB 컬럼이 아닌 응답 전용 필드.
   *
   * 구매확정으로 만들어진 거래 완료 기록의 ID. 후기는 주문이 아니라 완료
   * 기록에 붙으므로, 주문 화면에서 후기를 쓰려면 이 값이 필요합니다.
   */
  completionId?: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
