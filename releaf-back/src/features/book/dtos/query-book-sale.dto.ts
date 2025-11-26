import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SaleStatus } from '../entities/used-book-sale.entity';

export enum BookSaleSortBy {
  CREATED_AT = 'createdAt',
  PRICE = 'price',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryBookSaleDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(SaleStatus, { each: true })
  @IsArray()
  status?: SaleStatus[];

  @IsOptional()
  @IsEnum(BookSaleSortBy)
  sortBy?: BookSaleSortBy = BookSaleSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 12;
}
