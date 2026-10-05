import type { FeedbackType } from '@bookjeok/core';

import { defineDomainEvent } from '@/shared/events/domain-event';

export interface FeedbackCreatedEvent {
  feedbackId: number;
}

export interface FeedbackRepliedEvent {
  feedbackId: number;
  userId: number;
  type: FeedbackType;
  bookTitle?: string;
}

export const FeedbackEvents = {
  created: defineDomainEvent<FeedbackCreatedEvent>()('feedback.created'),
  replied: defineDomainEvent<FeedbackRepliedEvent>()('feedback.replied'),
};
