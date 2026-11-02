import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReadingLogModule } from '@/features/reading-log/reading-log.module';
import { WishlistModule } from '@/features/wishlist/wishlist.module';

import { BookController } from './controllers/book.controller';
import { Book } from './entities/book.entity';
import { BookViewCountInterceptor } from './interceptors/book-view-count.interceptor';
import { BookResolvePipe } from './pipes/book-resolve.pipe';
import {
  BOOK_DETAIL_PROVIDERS,
  BOOK_SEARCH_PROVIDERS,
} from './providers/book-catalog.types';
import { LocalDbBookCatalogProvider } from './providers/local-db-book-catalog.provider';
import { BookService } from './services/book.service';
import { BookCatalogService } from './services/book-catalog.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Book]), ReadingLogModule, WishlistModule],
  controllers: [BookController],
  providers: [
    BookService,
    BookCatalogService,
    LocalDbBookCatalogProvider,
    {
      /**
       * 검색 체인. 자체 DB 단독입니다.
       * 외부 공급처를 런타임 경로에 두지 않으며, 신규 도서는 오프라인 수집 파이프라인으로 확보합니다.
       * pg_trgm 서지 검색과, 인덱스 준비 시 기본 전문검색을 통한 소개 검색을 결합합니다.
       */
      provide: BOOK_SEARCH_PROVIDERS,
      useFactory: (localDb: LocalDbBookCatalogProvider) => [localDb],
      inject: [LocalDbBookCatalogProvider],
    },
    {
      /**
       * 상세 체인. 자체 DB 단독입니다.
       * ISBN(PK) 기반 단건 조회이며, 존재하지 않는 도서는 BOOK_NOT_FOUND 예외를 던집니다.
       */
      provide: BOOK_DETAIL_PROVIDERS,
      useFactory: (localDb: LocalDbBookCatalogProvider) => [localDb],
      inject: [LocalDbBookCatalogProvider],
    },
    BookViewCountInterceptor,
    BookResolvePipe,
  ],
  exports: [BookService, BookCatalogService, TypeOrmModule, BookResolvePipe], // 다른 모듈에서 Book 엔티티와 서비스 사용 가능
})
export class BookModule {}
