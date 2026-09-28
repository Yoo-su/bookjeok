import {
  FeedbackStatus,
  FeedbackType,
  GetAdminFeedbackParams,
} from '@bookjeok/core';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class GetAdminFeedbackQueryDto implements GetAdminFeedbackParams {
  @ApiProperty({ enum: FeedbackStatus, required: false })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @ApiProperty({ enum: FeedbackType, required: false })
  @IsOptional()
  @IsEnum(FeedbackType)
  type?: FeedbackType;

  @ApiProperty({ required: false, description: '이전 페이지 마지막 id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number;
}
