import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Book } from '@/features/book/entities/book.entity';
import { User } from '@/features/user/entities/user.entity';

@Entity({ name: 'reading_logs' })
// 이름은 운영에 이미 만들어진 것과 맞춘다. 무명으로 두면 TypeORM이 해시 이름을
// 기대해 개발·운영 스키마가 갈린다.
@Index('idx_reading_logs_isbn_date', ['isbn', 'date']) // 라운지 피드 (isbn별 그룹화 및 최신 날짜 정렬) 용도
@Index('idx_reading_logs_date', ['date']) // 라운지 인기작 (최근 N일 조회) 용도
@Index('idx_reading_logs_userid_date', ['userId', 'date']) // 개인 독서 기록 조회 용도
export class ReadingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.readingLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  isbn: string;

  /**
   * 도서 삭제 시 독서기록 보존을 위해 삭제를 제한합니다(NO ACTION).
   */
  @ManyToOne(() => Book)
  @JoinColumn({ name: 'isbn' })
  book: Book;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD 형식

  @Column({ length: 100, nullable: true })
  memo: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
