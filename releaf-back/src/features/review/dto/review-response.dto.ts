import { Review } from '../entities/review.entity';

export class GetReviewsResponseDto {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ReviewFeedDto {
  category: string;
  reviews: Review[];
}
