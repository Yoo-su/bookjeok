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

export class CreateBookSaleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(50)
  title: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  content: string;

  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls: string[];

  @ValidateNested()
  @Type(() => BookInfoDto)
  book: BookInfoDto;
}
