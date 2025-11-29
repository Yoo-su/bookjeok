import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  title: string;

  @IsString()
  category: string;

  @IsString()
  content: string;

  @IsString()
  bookIsbn: string;

  @IsArray()
  @ArrayMinSize(1)
  tags: string[];

  @IsOptional()
  book?: {
    isbn: string;
    title: string;
    author: string;
    publisher: string;
    image: string;
    description: string;
  };

  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  rating?: number;
}
