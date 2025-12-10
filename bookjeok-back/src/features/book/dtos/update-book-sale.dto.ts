import { PartialType } from '@nestjs/swagger';

import { CreateBookSaleDto } from './create-book-sale.dto';

export class UpdateBookSaleDto extends PartialType(CreateBookSaleDto) {}
