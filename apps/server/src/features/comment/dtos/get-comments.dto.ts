import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { COMMENT_PAGE_SIZE_MAX } from '../constants';
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
  @IsInt()
  @Min(1)
  page?: number = 1;

  // 0은 TypeORM take(0)이라 LIMIT 없이 전량 조회가 된다
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(COMMENT_PAGE_SIZE_MAX)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursorId?: number;
}
