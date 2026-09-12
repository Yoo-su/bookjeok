import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ActivityType } from '../activity-type.enum';

@Entity({ name: 'activity_logs' })
// 탈퇴 시 userId를 NULL로 바꾸는 비식별화가 userId로 찾는다.
@Index('IDX_activity_logs_user', ['userId'])
@Index('IDX_activity_logs_type', ['activityType'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer', nullable: true })
  userId: number | null;

  @Column({ type: 'varchar' })
  activityType: ActivityType;

  @Column()
  method: string;

  @Column()
  path: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
