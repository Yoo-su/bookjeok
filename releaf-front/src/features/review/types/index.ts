import { BookInfo } from "@/features/book/types";

export interface ReviewUser {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
}

export enum ReviewReactionType {
  LIKE = "LIKE",
  INSIGHTFUL = "INSIGHTFUL",
  SUPPORT = "SUPPORT",
}

export interface Review {
  id: number;
  title: string;
  content: string;
  bookIsbn: string;
  rating: number;
  tags: string[];
  category: string;
  viewCount: number;
  userId: number;
  reactionCounts?: {
    [key in ReviewReactionType]: number;
  };
  myReaction?: ReviewReactionType | null;
  user: ReviewUser;
  book: BookInfo;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFeed {
  category: string;
  reviews: Review[];
}

export interface GetReviewsParams {
  page?: number;
  limit?: number;
  bookIsbn?: string;
  tag?: string | null;
  search?: string;
  category?: string | null;
  userId?: number;
  enabled?: boolean;
}

export interface GetReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReviewFormValues {
  title: string;
  content: string;
  bookIsbn: string;
  category: string;
  tags: string[];
  rating: number;
  book?: {
    isbn: string;
    title: string;
    author: string;
    publisher: string;
    image: string;
    description: string;
  };
}
