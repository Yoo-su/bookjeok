import { PartialType } from '@nestjs/mapped-types';

import { CreateBookSaleDto } from './create-book-sale.dto';

export class UpdateBookSaleDto extends PartialType(CreateBookSaleDto) {}
