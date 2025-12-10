import { IsEnum, IsNotEmpty } from 'class-validator';
import { SaleStatus } from '@/features/book/entities/used-book-sale.entity';

export class UpdateSaleStatusDto {
  @IsNotEmpty()
  @IsEnum(SaleStatus)
  status: SaleStatus;
}
