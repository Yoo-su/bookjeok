import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetReviewsQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지 당 항목 수', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: '책 ISBN' })
  @IsOptional()
  @IsString()
  bookIsbn?: string;

  @ApiPropertyOptional({ description: '태그 (쉼표로 구분)' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: '검색어 (제목 또는 내용)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '카테고리' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '작성자 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;
}
