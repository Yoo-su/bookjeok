import { MAX_MEMO_LENGTH } from '@bookjeok/core';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateReadingLogDto {
  @ApiProperty({ description: '책 ISBN', example: '9788937460449' })
  @IsString()
  @IsNotEmpty()
  isbn: string;

  @ApiProperty({ description: '읽은 날짜 (YYYY-MM-DD)', example: '2023-10-01' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: `한 줄 메모 (선택, 최대 ${MAX_MEMO_LENGTH}자)`,
    example: '깊은 울림을 주는 책이었다.',
    required: false,
    maxLength: MAX_MEMO_LENGTH,
  })
  @IsString()
  @IsOptional()
  @MaxLength(MAX_MEMO_LENGTH)
  memo?: string;
}
