import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { ChatRoom } from '@/features/chat/entities/chat-room.entity';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';
import { User } from '@/features/user/entities/user.entity';

import { TradeReview } from './trade-review.entity';

export enum TradeCompletionMethod {
  /** 채팅으로 약속을 잡고 직접 만나 거래 (결제 없음) */
  DIRECT = 'DIRECT',
  /** 에스크로 결제 + 택배 배송 거래 */
  DELIVERY = 'DELIVERY',
}

/**
 * "거래가 성사됐다"는 사실 그 자체.
 *
 * 결제(Order)와 분리한 이유: 결제는 거래의 한 가지 수단일 뿐인데, 후기와
 * 신뢰 지표가 Order에만 매달려 있으면 직거래로 아무리 거래해도 후기를 남길
 * 수 없다. 후기는 이 완료 기록에 붙고, Order는 "돈이 어떻게 오갔는가"만
 * 담당한다.
 *
 * 직거래는 판매자 자기신고로 만들어지고, 택배 거래는 구매확정(`CONFIRMED`)
 * 시점에 시스템이 만든다. 신뢰 지표에서 두 경로를 구분해 보여줄 수 있도록
 * `method`를 남긴다.
 */
@Entity({ name: 'trade_completions' })
// 이름을 명시하지 않으면 TypeORM이 해시 이름을 만들어, 손으로 적용하는 운영 DDL과
// 개발 스키마가 어긋난다. 운영 규칙(IDX_{테이블}_{컬럼}, UQ_...)에 맞춰 고정한다.
@Index('IDX_trade_completions_sellerId_completedAt', [
  'sellerId',
  'completedAt',
])
@Index('IDX_trade_completions_buyerId_completedAt', ['buyerId', 'completedAt'])
@Index('IDX_trade_completions_chatRoomId', ['chatRoomId'])
@Unique('UQ_trade_completions_orderId', ['orderId'])
@Unique('UQ_trade_completions_saleId', ['saleId'])
export class TradeCompletion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UsedBookSale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: UsedBookSale;

  @Column()
  saleId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column()
  sellerId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @Column()
  buyerId: number;

  @ManyToOne(() => ChatRoom, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'chatRoomId' })
  chatRoom: ChatRoom | null;

  @Column({ nullable: true })
  chatRoomId: number | null;

  @Column({
    type: 'enum',
    enum: TradeCompletionMethod,
    default: TradeCompletionMethod.DIRECT,
  })
  method: TradeCompletionMethod;

  /**
   * 택배 거래일 때 이 완료를 만들어낸 주문. 직거래는 null.
   *
   * 문자열 참조로 둔 것은 order 모듈과의 순환 참조를 피하기 위해서다.
   * 결제는 거래의 한 수단이므로 trade가 order를 알 필요는 없다.
   */
  @Column({ type: 'varchar', nullable: true })
  orderId: string | null;

  @Column({ type: 'timestamptz' })
  completedAt: Date;

  /** 이 거래에 대해 양측이 남긴 후기 (최대 2건) */
  @OneToMany(() => TradeReview, (review) => review.completion)
  reviews: TradeReview[];

  // ---- 아래는 DB 컬럼이 아닌 응답 전용 필드 ----

  /** 이 거래에서 나의 역할. 거래 내역 목록에서 상대를 정하는 기준 */
  myRole?: 'BUYER' | 'SELLER';

  /** 나의 반대편 당사자 */
  counterparty?: User;

  /** 내가 이미 쓴 후기 (없으면 null) */
  myReview?: TradeReview | null;

  /** 지금 후기를 쓸 수 있는지 (미작성 + 기한 내) */
  canWriteReview?: boolean;

  /** 후기 작성 기한 */
  reviewExpiresAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
