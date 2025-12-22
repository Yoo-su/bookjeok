import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CommentTargetType } from '../entities/comment.entity';

/**
 * 댓글 목록 조회 쿼리 DTO
 */
export class GetCommentsDto {
  @IsEnum(CommentTargetType, { message: '유효하지 않은 타겟 타입입니다.' })
  targetType: CommentTargetType;

  @IsNotEmpty({ message: '타겟 ID는 필수입니다.' })
  @IsString()
  targetId: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
