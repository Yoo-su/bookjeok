import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({
    description: '추가 설명 (선택 사항)',
    example: '줄거리 위주로 요약해줘',
    required: false,
  })
  description?: string;
}
