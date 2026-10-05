import type { Comment } from '@/features/comment/entities/comment.entity';
import { defineDomainEvent } from '@/shared/events/domain-event';

export interface CommentCreatedEvent {
  comment: Comment;
}

export interface CommentLikedEvent {
  comment: Comment;
  actorId: number;
  isLiked: boolean;
}

export const CommentEvents = {
  created: defineDomainEvent<CommentCreatedEvent>()('comment.created'),
  liked: defineDomainEvent<CommentLikedEvent>()('comment.liked'),
};
