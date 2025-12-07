import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Observable } from 'rxjs';

@Injectable()
export abstract class BaseViewCountInterceptor implements NestInterceptor {
  constructor(protected cacheManager: Cache) {}

  /**
   * 캐시 키에 사용할 접두사 (예: 'view_count', 'used_book_view_count')
   */
  protected abstract get cachePrefix(): string;

  /**
   * 실제 조회수를 증가시키는 비즈니스 로직을 구현해야 합니다.
   * @param id 대상 리소스 ID
   */
  protected abstract incrementCount(id: number): Promise<void>;

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const id = request.params.id;

    // x-forwarded-for 헤더를 먼저 확인하여 실제 클라이언트 IP를 가져옵니다.
    const ip =
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.ip ||
      request.connection.remoteAddress;

    if (id && ip) {
      const cacheKey = `${this.cachePrefix}:${id}:${ip}`;
      const isViewed = await this.cacheManager.get(cacheKey);

      if (!isViewed) {
        await this.incrementCount(Number(id));
        // 24시간 TTL (밀리초 단위)
        await this.cacheManager.set(cacheKey, '1', 24 * 60 * 60 * 1000);
      }
    }

    return next.handle();
  }
}
