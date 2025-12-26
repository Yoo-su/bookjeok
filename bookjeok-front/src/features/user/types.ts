import { BookInfo, UsedBookSale } from "../book/types";

export interface WishlistItem {
  id: number;
  book: BookInfo | null;
  usedBookSale: UsedBookSale | null;
  createdAt: string;
}

/**
 * 공개 사용자 프로필
 */
export interface PublicUserProfile {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  createdAt: string;
  stats: {
    salesCount: number;
    reviewsCount: number;
  };
  recentReviews: RecentReview[];
  recentSales: RecentSale[];
}

export interface RecentReview {
  id: number;
  title: string;
  bookTitle: string;
  bookImage: string | null;
  createdAt: string;
}

export interface RecentSale {
  id: number;
  bookTitle: string;
  bookImage: string | null;
  price: number;
  status: string;
  createdAt: string;
}
