import { MAX_COMMENT_LENGTH } from '@bookjeok/core';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * 댓글 수정 DTO
 */
export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(MAX_COMMENT_LENGTH, {
    message: `댓글은 최대 ${MAX_COMMENT_LENGTH}자까지 작성 가능합니다.`,
  })
  content?: string;
}
