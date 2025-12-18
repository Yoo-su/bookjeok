import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Request } from 'express';
import { BookService } from '../services/book.service';
import { BaseViewCountInterceptor } from '@/shared/interceptors/base-view-count.interceptor';

/**
 * 책 상세페이지 조회수를 기록하는 인터셉터
 * - ISBN(string) 기반으로 동작
 * - IP 기반 24시간 중복 방지
 */
@Injectable()
export class BookViewCountInterceptor extends BaseViewCountInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    private bookService: BookService,
  ) {
    super(cacheManager);
  }

  protected get cachePrefix(): string {
    return 'book_view_count';
  }

  /**
   * ISBN은 params.isbn에서 가져옴
   */
  protected getResourceId(request: Request): string | undefined {
    return request.params.isbn;
  }

  protected async incrementCount(isbn: number | string): Promise<void> {
    await this.bookService.incrementBookViewCount(String(isbn));
  }
}
