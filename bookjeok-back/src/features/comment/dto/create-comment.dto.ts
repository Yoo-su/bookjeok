import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CommentTargetType } from '../entities/comment.entity';

/**
 * 댓글 생성 DTO
 */
export class CreateCommentDto {
  @IsNotEmpty({ message: '댓글 내용은 필수입니다.' })
  @IsString()
  @MaxLength(1000, { message: '댓글은 최대 1000자까지 작성 가능합니다.' })
  content: string;

  @IsEnum(CommentTargetType, { message: '유효하지 않은 타겟 타입입니다.' })
  targetType: CommentTargetType;

  @IsNotEmpty({ message: '타겟 ID는 필수입니다.' })
  @IsString()
  targetId: string;
}
