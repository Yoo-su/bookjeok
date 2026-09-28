import {
  CreateFeedbackParams,
  FEEDBACK_BOOK_FIELD_MAX_LENGTH,
  FEEDBACK_CONTENT_MAX_LENGTH,
  FEEDBACK_PAGE_PATH_MAX_LENGTH,
  FeedbackType,
} from '@bookjeok/core';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/**
 * 문의·제보 작성 DTO
 * - 종류별 필수 항목은 서비스에서 검사한다 (IsOptional이 ValidateIf를 무력화함)
 */
export class CreateFeedbackDto implements CreateFeedbackParams {
  @ApiProperty({ enum: FeedbackType, description: '종류' })
  @IsEnum(FeedbackType, { message: '유효하지 않은 문의 종류입니다.' })
  type: FeedbackType;

  @ApiProperty({ required: false, description: '내용 (책 요청 외에는 필수)' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(FEEDBACK_CONTENT_MAX_LENGTH)
  content?: string;

  @ApiProperty({ required: false, description: '책 제목 (책 요청은 필수)' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(FEEDBACK_BOOK_FIELD_MAX_LENGTH)
  bookTitle?: string;

  @ApiProperty({ required: false, description: '저자' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(FEEDBACK_BOOK_FIELD_MAX_LENGTH)
  bookAuthor?: string;

  @ApiProperty({ required: false, description: '출판사' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(FEEDBACK_BOOK_FIELD_MAX_LENGTH)
  bookPublisher?: string;

  @ApiProperty({ required: false, description: '제보를 연 페이지 (/로 시작)' })
  @IsOptional()
  @IsString()
  @MaxLength(FEEDBACK_PAGE_PATH_MAX_LENGTH)
  // 운영자 메일에 도메인 뒤에 붙여 링크로 쓴다. 다른 호스트로 새지 않게 경로만 받는다
  @Matches(/^\//, { message: '페이지 경로가 올바르지 않습니다.' })
  pagePath?: string;
}
