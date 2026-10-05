import {
  TRADE_REVIEW_CONTENT_MAX_LENGTH,
  TradeReviewTag,
} from '@bookjeok/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateTradeReviewDto {
  @ApiPropertyOptional({
    description: '수정할 거래 후기 평가 태그 목록',
    enum: TradeReviewTag,
    isArray: true,
    example: [TradeReviewTag.GOOD_CONDITION, TradeReviewTag.FAST_RESPONSE],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(TradeReviewTag, { each: true })
  @IsOptional()
  tags?: TradeReviewTag[];

  @ApiPropertyOptional({
    description: `수정할 후기 내용 (최대 ${TRADE_REVIEW_CONTENT_MAX_LENGTH}자)`,
    example: '포장도 깔끔하고 친절하셨어요.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(TRADE_REVIEW_CONTENT_MAX_LENGTH)
  content?: string;
}
