import { SEARCH_PREVIEW_MAX_LENGTH } from '@bookjeok/core';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class SearchPreviewQueryDto {
  @ApiProperty({
    description: '검색어. 2글자 미만이면 빈 결과',
    example: '한강',
  })
  @IsString()
  @MaxLength(SEARCH_PREVIEW_MAX_LENGTH)
  q: string;
}
