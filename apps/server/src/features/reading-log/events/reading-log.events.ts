import { defineDomainEvent } from '@/shared/events/domain-event';

export interface ReadingLogKongSentEvent {
  readingLogId: string;
  /** 기록 주인 */
  ownerId: number;
  senderId: number;
  date: string;
  bookTitle: string;
}

export const ReadingLogEvents = {
  kongSent: defineDomainEvent<ReadingLogKongSentEvent>()(
    'reading-log.kong-sent',
  ),
};
