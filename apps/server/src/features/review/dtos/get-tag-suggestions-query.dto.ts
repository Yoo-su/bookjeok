import { TAG_SUGGESTION_LIMIT } from '@bookjeok/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetTagSuggestionsQueryDto {
  @ApiPropertyOptional({
    description: '입력 중인 문자열. 비우면 사용 빈도 상위를 반환합니다.',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: '제안 개수',
    default: TAG_SUGGESTION_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = TAG_SUGGESTION_LIMIT;
}
