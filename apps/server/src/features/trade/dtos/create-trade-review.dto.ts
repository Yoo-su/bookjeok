import {
  TRADE_REVIEW_CONTENT_MAX_LENGTH,
  TradeReviewTag,
} from '@bookjeok/core';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTradeReviewDto {
  @ApiProperty({
    description: '후기를 남길 거래 완료 기록 ID',
    example: 42,
  })
  @IsInt()
  @IsPositive()
  completionId: number;

  @ApiProperty({
    description: '거래 후기 평가 태그 목록 (최소 1개)',
    enum: TradeReviewTag,
    isArray: true,
    example: [TradeReviewTag.GOOD_CONDITION, TradeReviewTag.KIND_MANNER],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(TradeReviewTag, { each: true })
  tags: TradeReviewTag[];

  @ApiPropertyOptional({
    description: `한 줄 텍스트 후기 내용 (최대 ${TRADE_REVIEW_CONTENT_MAX_LENGTH}자)`,
    example: '책 상태가 설명과 똑같았고 친절하셨습니다.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(TRADE_REVIEW_CONTENT_MAX_LENGTH)
  content?: string;
}
