import { MAX_MEMO_LENGTH } from '@bookjeok/core';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

import { CreateReadingLogDto } from './create-reading-log.dto';

export class UpdateReadingLogDto extends PartialType(CreateReadingLogDto) {
  @ApiProperty({
    description: `수정할 메모 내용 (최대 ${MAX_MEMO_LENGTH}자)`,
    example: '생각보다 밝은 내용이었다.',
    required: false,
    maxLength: MAX_MEMO_LENGTH,
  })
  @IsString()
  @IsOptional()
  @MaxLength(MAX_MEMO_LENGTH)
  memo?: string;
}
