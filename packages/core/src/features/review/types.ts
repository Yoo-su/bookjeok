import { BookInfo } from "../book/types";

export interface ReviewUser {
  id: number;
  handle: string;
  nickname: string;
  profileImageUrl: string | null;
}

export enum ReviewReactionType {
  LIKE = "LIKE",
  INSIGHTFUL = "INSIGHTFUL",
  SUPPORT = "SUPPORT",
}

export type ReviewReactionCounts = {
  [key in ReviewReactionType]: number;
};

export interface Review {
  id: number;
  title: string;
  content: string;
  isbn: string;
  rating: number;
  tags: string[];
  category: string;
  viewCount: number;
  userId: number;
  reactionCount?: number;
  reactionCounts?: ReviewReactionCounts;
  isPublic: boolean;

  user: ReviewUser;
  book: BookInfo;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFeed {
  category: string;
  reviews: Review[];
}

/** 태그 자동완성 항목. count는 공개 리뷰 기준 사용 횟수다. */
export interface TagSuggestion {
  name: string;
  count: number;
}

export interface GetTagSuggestionsParams {
  /** 입력 중인 문자열. 비우면 사용 빈도 상위를 돌려준다. */
  q?: string;
  limit?: number;
}

export interface GetReviewsParams {
  page?: number;
  limit?: number;
  isbn?: string;
  tag?: string | null;
  search?: string;
  category?: string | null;
  userId?: number;
  excludeId?: number;
  cursorId?: number;
}

export interface GetReviewsResponse {
  reviews: Review[];
  total?: number;
  page: number;
  limit: number;
  totalPages?: number;
  hasNextPage?: boolean;
  nextCursor?: number;
}

export interface ReviewFormValues {
  title: string;
  content: string;
  isbn: string;
  category: string;
  tags: string[];
  rating: number;
  isPublic: boolean;
}
