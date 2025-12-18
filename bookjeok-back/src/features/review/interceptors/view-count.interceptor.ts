import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ReviewService } from '../services/review.service';
import { BaseViewCountInterceptor } from '@/shared/interceptors/base-view-count.interceptor';

@Injectable()
export class ViewCountInterceptor extends BaseViewCountInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    private reviewService: ReviewService,
  ) {
    super(cacheManager);
  }

  protected get cachePrefix(): string {
    return 'view_count';
  }

  protected async incrementCount(id: number | string): Promise<void> {
    await this.reviewService.incrementViewCount(Number(id));
  }
}
