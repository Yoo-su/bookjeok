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

import { User } from '@/features/user/entities/user.entity';

import { ReadingLog } from './reading-log.entity';

/**
 * 독서 기록에 보낸 콩. 한 기록에 한 사람이 한 알이고 거둬들이지 않는다.
 * 제약·인덱스 이름은 운영 DDL(수동 적용 16절)과 맞춘다.
 */
@Entity({ name: 'reading_log_kongs' })
@Unique('UQ_reading_log_kongs_readingLogId_senderId', [
  'readingLogId',
  'senderId',
])
// 유니크는 readingLogId가 앞이라 보낸 사람 기준 조회·탈퇴 정리를 받지 못한다
@Index('IDX_reading_log_kongs_senderId', ['senderId'])
export class ReadingLogKong {
  @PrimaryGeneratedColumn({
    primaryKeyConstraintName: 'PK_reading_log_kongs_id',
  })
  id: number;

  @Column({ type: 'uuid' })
  readingLogId: string;

  @ManyToOne(() => ReadingLog, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'readingLogId',
    foreignKeyConstraintName: 'FK_reading_log_kongs_readingLogId',
  })
  readingLog: ReadingLog;

  @Column()
  senderId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'senderId',
    foreignKeyConstraintName: 'FK_reading_log_kongs_senderId',
  })
  sender: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
