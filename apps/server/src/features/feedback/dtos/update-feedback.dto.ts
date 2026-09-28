import {
  FEEDBACK_ADMIN_NOTE_MAX_LENGTH,
  FEEDBACK_REPLY_MAX_LENGTH,
  FeedbackStatus,
  UpdateFeedbackParams,
} from '@bookjeok/core';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * 운영자 처리 DTO
 * - reply·adminNote에 빈 문자열을 보내면 지운다
 */
export class UpdateFeedbackDto implements UpdateFeedbackParams {
  @ApiProperty({ enum: FeedbackStatus, required: false })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @ApiProperty({ required: false, description: '작성자에게 보이는 답변' })
  @IsOptional()
  @IsString()
  @MaxLength(FEEDBACK_REPLY_MAX_LENGTH)
  reply?: string;

  @ApiProperty({ required: false, description: '운영자만 보는 메모' })
  @IsOptional()
  @IsString()
  @MaxLength(FEEDBACK_ADMIN_NOTE_MAX_LENGTH)
  adminNote?: string;
}
