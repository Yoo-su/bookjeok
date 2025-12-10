import { ApiProperty } from '@nestjs/swagger';
import { Review } from '../entities/review.entity';
import { ReviewReactionType } from '../entities/review-reaction.entity';

export class ReviewResponseDto extends Review {
  @ApiProperty({
    description: '리액션별 카운트',
    example: { LIKE: 10, INSIGHTFUL: 5, SUPPORT: 2 },
    required: false,
  })
  reactionCounts?: {
    [key in ReviewReactionType]: number;
  };

  @ApiProperty({
    description: '태그 목록',
    example: ['소설', '감동'],
    required: false,
  })
  tags?: string[];
}

export class GetReviewsResponseDto {
  @ApiProperty({ type: [ReviewResponseDto] })
  reviews: ReviewResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class ReviewFeedDto {
  @ApiProperty()
  category: string;

  @ApiProperty({ type: [ReviewResponseDto] })
  reviews: ReviewResponseDto[];
}
