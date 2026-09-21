import { REVIEW_TAG_MAX_COUNT, REVIEW_TAG_MAX_LENGTH } from '@bookjeok/core';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  title: string;

  @IsString()
  category: string;

  @IsString()
  content: string;

  @IsString()
  @IsNotEmpty()
  isbn: string;

  // 상한은 작성 폼에만 있었다. API로 직접 넣으면 개수·길이 제한이 없었다.
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(REVIEW_TAG_MAX_COUNT)
  @IsString({ each: true })
  @MaxLength(REVIEW_TAG_MAX_LENGTH, { each: true })
  tags: string[];

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  rating?: number;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
