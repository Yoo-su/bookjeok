import { Exclude, Expose } from 'class-transformer';
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

import { USER_SELF_GROUP } from '../constants';

@Entity({ name: 'users' })
@Unique(['provider', 'providerId'])
// 컬럼 옵션(`unique: true`)으로는 제약 이름을 지정할 수 없어 운영 이름과
// 어긋난다. 클래스 레벨로 올려 운영에 있는 이름을 그대로 박는다.
@Unique('UQ_users_handle', ['handle'])
// findByNickname()이 닉네임 중복 검사에 쓴다.
@Index('idx_users_nickname', ['nickname'])
/**
 * 직렬화 규칙
 * - 비밀번호·인증 토큰·토큰 버전은 어떤 응답에도 내보내지 않습니다.
 * - 이메일·실명·성별·연령대·로그인 제공자는 `USER_SELF_GROUP`일 때만 내보냅니다.
 *   판매글·리뷰·댓글·채팅에 실리는 작성자는 남에게 보이므로 기본은 숨깁니다.
 */
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Expose({ groups: [USER_SELF_GROUP] })
  @Column()
  provider: string;

  @Expose({ groups: [USER_SELF_GROUP] })
  @Column({ name: 'providerId' })
  providerId: string;

  @Expose({ groups: [USER_SELF_GROUP] })
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

  @Expose({ groups: [USER_SELF_GROUP] })
  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Expose({ groups: [USER_SELF_GROUP] })
  @Column({ type: 'varchar', nullable: true })
  gender: string | null;

  @Expose({ groups: [USER_SELF_GROUP] })
  @Column({ name: 'ageRange', type: 'varchar', nullable: true })
  ageRange: string | null;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken: string | null;

  @Exclude()
  @Column({ nullable: true, type: 'timestamptz' })
  emailVerificationExpiresAt: Date | null;

  @Exclude()
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
