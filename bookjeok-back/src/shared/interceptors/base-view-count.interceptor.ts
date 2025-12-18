import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export abstract class BaseViewCountInterceptor implements NestInterceptor {
  constructor(protected cacheManager: Cache) {}

  /**
   * 캐시 키에 사용할 접두사 (예: 'view_count', 'used_book_view_count')
   */
  protected abstract get cachePrefix(): string;

  /**
   * 요청에서 리소스 ID를 추출합니다.
   * 기본적으로 params.id를 사용하며, 필요시 오버라이드하세요.
   * @param request Express Request 객체
   */
  protected getResourceId(request: Request): string | number | undefined {
    return request.params.id;
  }

  /**
   * 실제 조회수를 증가시키는 비즈니스 로직을 구현해야 합니다.
   * @param id 대상 리소스 ID (number 또는 string)
   */
  protected abstract incrementCount(id: number | string): Promise<void>;

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const id = this.getResourceId(request);

    // x-forwarded-for 헤더를 먼저 확인하여 실제 클라이언트 IP를 가져옵니다.
    const ip =
      request.headers['x-forwarded-for']?.toString().split(',')[0] ||
      request.ip ||
      request.socket?.remoteAddress;

    if (id && ip) {
      const cacheKey = `${this.cachePrefix}:${id}:${ip}`;
      const isViewed = await this.cacheManager.get(cacheKey);

      if (!isViewed) {
        await this.incrementCount(id);
        // 24시간 TTL (밀리초 단위)
        await this.cacheManager.set(cacheKey, '1', 24 * 60 * 60 * 1000);
      }
    }

    return next.handle();
  }
}
