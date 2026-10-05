import type { ActivityType } from '@/shared/activity/activity-type.enum';
import { defineDomainEvent } from '@/shared/events/domain-event';

/** 인터셉터에서 이벤트로 전달되는 로그 데이터 형태 기록 */
export interface ActivityLogCreatedEvent {
  userId: number | null;
  activityType: ActivityType;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  details: Record<string, unknown> | null;
}

export const activityLogCreatedEvent =
  defineDomainEvent<ActivityLogCreatedEvent>()('ACTIVITY_LOG.CREATED');
