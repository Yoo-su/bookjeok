import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { BookService } from '../services/book.service';
import { BaseViewCountInterceptor } from '@/shared/interceptors/base-view-count.interceptor';

@Injectable()
export class UsedBookViewCountInterceptor extends BaseViewCountInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    private bookService: BookService,
  ) {
    super(cacheManager);
  }

  protected get cachePrefix(): string {
    return 'used_book_view_count';
  }

  protected async incrementCount(id: number | string): Promise<void> {
    await this.bookService.incrementViewCount(Number(id));
  }
}
