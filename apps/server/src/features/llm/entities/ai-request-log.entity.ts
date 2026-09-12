import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('ai_request_logs')
// userId는 탈퇴 정리가 쓰고, 나머지 둘은 토큰·비용 집계를 손으로 볼 때 쓴다.
@Index('idx_ai_request_logs_user_id', ['userId'])
@Index('idx_ai_request_logs_feature', ['feature'])
@Index('idx_ai_request_logs_created_at', ['createdAt'])
export class AiRequestLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer', nullable: true })
  userId: number | null;

  @Column({ type: 'varchar' })
  feature: 'TALK' | 'BOOK_SUMMARY';

  @Column({ type: 'varchar' })
  model: string;

  @Column({ type: 'integer', nullable: true })
  promptTokens: number | null;

  @Column({ type: 'integer', nullable: true })
  completionTokens: number | null;

  @Column({ type: 'integer', nullable: true })
  totalTokens: number | null;

  @Column({ type: 'integer', nullable: true })
  latencyMs: number | null;

  @Column({ type: 'jsonb', nullable: true })
  requestPayload: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  responsePayload: Record<string, unknown> | null;

  @Column({ type: 'varchar', default: 'SUCCESS' })
  status: 'SUCCESS' | 'ERROR';

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
