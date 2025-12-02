import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Observable } from 'rxjs';
import { ReviewService } from '../services/review.service';

@Injectable()
export class ViewCountInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reviewService: ReviewService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const reviewId = request.params.id;
    const ip = request.ip || request.connection.remoteAddress;

    if (reviewId && ip) {
      const cacheKey = `view_count:${reviewId}:${ip}`;
      const isViewed = await this.cacheManager.get(cacheKey);

      if (!isViewed) {
        await this.reviewService.incrementViewCount(Number(reviewId));
        // 24시간 TTL (밀리초 단위)
        // NestJS CacheModule의 기본 인메모리 스토어는 버전에 따라 ms 또는 초 단위를 사용합니다.
        // 최신 버전의 cache-manager는 밀리초를 사용하므로 24 * 60 * 60 * 1000으로 설정합니다.
        await this.cacheManager.set(cacheKey, '1', 24 * 60 * 60 * 1000);
      }
    }

    return next.handle();
  }
}
