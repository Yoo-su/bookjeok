import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { ReadingLog } from '@/features/reading-log/entities/reading-log.entity';
import { Review } from '@/features/review/entities/review.entity';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';

@Entity({ name: 'users' })
@Unique(['provider', 'providerId'])
// 컬럼 옵션(`unique: true`)으로는 제약 이름을 지정할 수 없어 운영 이름과
// 어긋난다. 클래스 레벨로 올려 운영에 있는 이름을 그대로 박는다.
@Unique('UQ_users_handle', ['handle'])
// findByNickname()이 닉네임 중복 검사에 쓴다.
@Index('idx_users_nickname', ['nickname'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  provider: string;

  @Column({ name: 'providerId' })
  providerId: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string;

  @Column()
  nickname: string;

  @Column({ nullable: true })
  handle: string;

  @Column({ name: 'profileImageUrl', nullable: true })
  profileImageUrl: string;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  deletedAt: Date;

  @Column({ default: true })
  isReadingLogPublic: boolean;

  @Column({ nullable: true, type: 'timestamptz' })
  lastActiveAt: Date;

  @Column({ type: 'varchar', length: 20, default: 'USER' })
  role: 'USER' | 'ADMIN';

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', nullable: true })
  gender: string | null;

  @Column({ name: 'ageRange', type: 'varchar', nullable: true })
  ageRange: string | null;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  emailVerificationExpiresAt: Date | null;

  @Column({ default: 0 })
  tokenVersion: number;

  @OneToMany(() => UsedBookSale, (sale) => sale.user)
  usedBookSales: UsedBookSale[];

  @OneToMany(() => ChatParticipant, (participant) => participant.user)
  chatParticipants: ChatParticipant[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => ReadingLog, (readingLog) => readingLog.user)
  readingLogs: ReadingLog[];
}
