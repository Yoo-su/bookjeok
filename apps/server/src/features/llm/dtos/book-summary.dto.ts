import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BookSummaryDto {
  @IsString()
  @IsNotEmpty({ message: '책 제목은 필수 항목입니다.' })
  @ApiProperty({ description: '책 제목', example: '데미안' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '저자 정보는 필수 항목입니다.' })
  @ApiProperty({ description: '저자', example: '헤르만 헤세' })
  author: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '추가 설명 (선택 사항)',
    example: '줄거리 위주로 요약해줘',
    required: false,
  })
  description?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description:
      'ISBN (선택 사항). 있으면 제목·저자·소개·출판사 대신 DB 서지로 생성하고 저장합니다.',
    example: '9788937460777',
    required: false,
  })
  isbn?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '출판사 (선택 사항)',
    example: '민음사',
    required: false,
  })
  publisher?: string;
}
