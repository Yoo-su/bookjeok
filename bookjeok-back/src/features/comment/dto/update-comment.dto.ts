import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * 댓글 수정 DTO
 */
export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: '댓글은 최대 1000자까지 작성 가능합니다.' })
  content?: string;
}
