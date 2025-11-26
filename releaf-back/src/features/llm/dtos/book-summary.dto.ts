import { IsNotEmpty, IsString } from 'class-validator';

export class BookSummaryDto {
  @IsString()
  @IsNotEmpty({ message: '책 제목은 필수 항목입니다.' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '저자 정보는 필수 항목입니다.' })
  author: string;
}
