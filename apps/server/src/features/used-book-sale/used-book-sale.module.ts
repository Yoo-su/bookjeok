import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { BookModule } from '@/features/book/book.module';
import { Order } from '@/features/order/entities/order.entity';
import { TradeCompletion } from '@/features/trade/entities/trade-completion.entity';
import { UserModule } from '@/features/user/user.module';

import { UsedBookSaleController } from './controllers/used-book-sale.controller';
import { UsedBookSale } from './entities/used-book-sale.entity';
import { UsedBookViewCountInterceptor } from './interceptors/used-book-view-count.interceptor';
import { UsedBookSaleCleanupListener } from './listeners/used-book-sale-cleanup.listener';
import { UsedBookSaleService } from './services/used-book-sale.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsedBookSale, Order, TradeCompletion]),
    BookModule, // Book 엔티티와 BookService 사용
    UserModule,
  ],
  controllers: [UsedBookSaleController],
  providers: [
    UsedBookSaleService,
    UsedBookViewCountInterceptor,
    UsedBookSaleCleanupListener,
  ],
  exports: [UsedBookSaleService],
})
export class UsedBookSaleModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 모듈 초기화 시 GiST 인덱스 생성 (거리 기반 검색 최적화)
   */
  async onModuleInit() {
    // 거리 계산을 위한 PostgreSQL cube 및 earthdistance 확장 활성화
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS cube');
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS earthdistance');

    await this.dataSource.query(
      'CREATE INDEX IF NOT EXISTS "used_book_sales_location_idx" ON "used_book_sales" USING GiST (ll_to_earth("latitude", "longitude"))',
    );
  }
}
