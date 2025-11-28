import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsNumber,
  IsPositive,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BookInfoDto } from './book-info.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookSaleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(50)
  @ApiProperty({
    description: '판매글 제목',
    example: '깨끗한 전공책 팝니다',
    minLength: 5,
    maxLength: 50,
  })
  title: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty({ description: '판매 가격', example: 15000, minimum: 0 })
  price: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '거래 희망 도시 (시/도)', example: '서울특별시' })
  city: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '거래 희망 구/군', example: '강남구' })
  district: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  @ApiProperty({
    description: '판매글 내용',
    example: '필기감 전혀 없는 새 책입니다.',
    minLength: 10,
    maxLength: 1000,
  })
  content: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @ApiProperty({
    description: '상품 이미지 URL 목록',
    example: ['https://example.com/image1.jpg'],
    type: [String],
  })
  imageUrls: string[];

  @ValidateNested()
  @Type(() => BookInfoDto)
  @ApiProperty({ description: '책 정보', type: BookInfoDto })
  book: BookInfoDto;
}
