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

  @ApiProperty({
    description: '공개 여부',
    example: true,
  })
  isPublic: boolean;
}

export class TagSuggestionDto {
  @ApiProperty({ description: '태그 이름', example: '카뮈' })
  name: string;

  @ApiProperty({ description: '공개 리뷰 기준 사용 횟수', example: 5 })
  count: number;
}

export class GetReviewsResponseDto {
  @ApiProperty({ type: [ReviewResponseDto] })
  reviews: ReviewResponseDto[];

  @ApiProperty({ required: false })
  total?: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({ required: false })
  @ApiProperty({ required: false })
  totalPages?: number;

  @ApiProperty({ required: false })
  nextCursor?: number;

  @ApiProperty()
  hasNextPage: boolean;
}

export class ReviewFeedDto {
  @ApiProperty()
  category: string;

  @ApiProperty({ type: [ReviewResponseDto] })
  reviews: ReviewResponseDto[];
}
