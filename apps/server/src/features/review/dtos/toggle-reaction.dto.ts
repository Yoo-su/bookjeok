import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { ReviewReactionType } from '../entities/review-reaction.entity';

export class ToggleReactionDto {
  @ApiProperty({
    description: '리액션 종류. 이미 같은 종류로 반응했다면 취소됩니다.',
    enum: ReviewReactionType,
    example: ReviewReactionType.LIKE,
  })
  @IsEnum(ReviewReactionType)
  type: ReviewReactionType;
}
