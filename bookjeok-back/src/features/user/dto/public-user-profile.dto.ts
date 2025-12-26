/**
 * 공개 사용자 프로필 응답 DTO
 * 민감 정보(email, providerId 등)를 제외한 공개 가능한 정보만 포함
 */
export interface PublicUserProfileDto {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  createdAt: Date;
  stats: {
    salesCount: number;
    reviewsCount: number;
    // 추후 확장: leafScore (잎사귀 점수)
  };
  recentReviews: RecentReviewDto[];
  recentSales: RecentSaleDto[];
}

/**
 * 최근 리뷰 요약 DTO
 */
export interface RecentReviewDto {
  id: number;
  title: string;
  bookTitle: string;
  bookImage: string | null;
  createdAt: Date;
}

/**
 * 최근 판매글 요약 DTO
 */
export interface RecentSaleDto {
  id: number;
  bookTitle: string;
  bookImage: string | null;
  price: number;
  status: string;
  createdAt: Date;
}
