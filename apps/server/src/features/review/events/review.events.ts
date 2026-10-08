import type { ReviewResponseDto } from '@/features/review/dtos/review-response.dto';
import { defineDomainEvent } from '@/shared/events/domain-event';

export interface ReviewReactedEvent {
  review: ReviewResponseDto;
  actorId: number;
  isAdded: boolean;
}

export interface ReviewChangedEvent {
  reviewId: number;
  isPublic: boolean;
  wasPublic: boolean;
}

export const ReviewEvents = {
  reacted: defineDomainEvent<ReviewReactedEvent>()('review.reacted'),
  changed: defineDomainEvent<ReviewChangedEvent>()('review.changed'),
};
