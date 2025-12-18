import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookController } from './controllers/book.controller';
import { BookService } from './services/book.service';
import { Book } from './entities/book.entity';
import { UsedBookSale } from './entities/used-book-sale.entity';
import { UserModule } from '../user/user.module';
import { DataSource } from 'typeorm';
import { UsedBookViewCountInterceptor } from './interceptors/used-book-view-count.interceptor';
import { BookViewCountInterceptor } from './interceptors/book-view-count.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([Book, UsedBookSale]), UserModule],
  controllers: [BookController],
  providers: [
    BookService,
    UsedBookViewCountInterceptor,
    BookViewCountInterceptor,
  ],
})
export class BookModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.dataSource.query(
      'CREATE INDEX IF NOT EXISTS "used_book_sales_location_idx" ON "used_book_sales" USING GiST (ll_to_earth("latitude", "longitude"))',
    );
  }
}
