import { FeedbackStatus, FeedbackType } from "@bookjeok/core";

export const FEEDBACK_TYPES = [
  FeedbackType.BOOK_REQUEST,
  FeedbackType.BUG,
  FeedbackType.SUGGESTION,
  FeedbackType.OTHER,
] as const;

/** 번역 키 (feedback.types.*, feedback.placeholders.*) */
export const FEEDBACK_TYPE_KEYS = {
  [FeedbackType.BOOK_REQUEST]: "book_request",
  [FeedbackType.BUG]: "bug",
  [FeedbackType.SUGGESTION]: "suggestion",
  [FeedbackType.OTHER]: "other",
} as const;

export const FEEDBACK_STATUSES = [
  FeedbackStatus.RECEIVED,
  FeedbackStatus.IN_PROGRESS,
  FeedbackStatus.DONE,
  FeedbackStatus.WONT_FIX,
] as const;

/** 번역 키 (feedback.status.*) */
export const FEEDBACK_STATUS_KEYS = {
  [FeedbackStatus.RECEIVED]: "received",
  [FeedbackStatus.IN_PROGRESS]: "in_progress",
  [FeedbackStatus.DONE]: "done",
  [FeedbackStatus.WONT_FIX]: "wont_fix",
} as const;
