import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { instanceToPlain } from 'class-transformer';
import { Request } from 'express';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { BusinessException } from '@/shared/exceptions';

/** 락 및 응답 보관 기간 (10분) */
const IDEMPOTENCY_TTL_MS = 600000;

interface IdempotencyRecord {
  status: 'processing' | 'completed';
  response?: unknown;
}

/**
 * `x-idempotency-key` 헤더가 붙은 요청의 중복 실행을 막습니다.
 *
 * 완료된 요청을 같은 키로 다시 보내면 **처음 응답을 그대로 돌려줍니다.**
 * 409를 던지면 네트워크가 끊겨 응답을 못 받은 클라이언트가 재시도할 방법이
 * 없어집니다(요청은 이미 반영됐는데 화면은 실패로 보임). 아직 처리 중인
 * 동안에만 409로 막습니다.
 *
 * 키는 사용자별로 격리합니다. 전역 네임스페이스에 두면 남이 쓴 키와 충돌해
 * 엉뚱한 응답을 받을 수 있습니다.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { id: number } }>();
    const idempotencyKey = request.headers['x-idempotency-key'];

    if (typeof idempotencyKey !== 'string' || !idempotencyKey.trim()) {
      return next.handle();
    }

    const cacheKey = this.buildCacheKey(idempotencyKey, request.user?.id);
    const cached = await this.cacheManager.get<IdempotencyRecord>(cacheKey);

    if (cached?.status === 'processing') {
      throw new BusinessException('REQUEST_IN_PROGRESS', HttpStatus.CONFLICT);
    }

    if (cached?.status === 'completed') {
      // 처음 응답을 그대로 재생한다. 핸들러는 다시 실행하지 않는다.
      return of(cached.response);
    }

    await this.cacheManager.set(
      cacheKey,
      { status: 'processing' } satisfies IdempotencyRecord,
      IDEMPOTENCY_TTL_MS,
    );

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          void this.cacheManager
            .set(
              cacheKey,
              {
                status: 'completed',
                // 캐시는 JSON으로 저장돼 클래스 정보가 사라진다. 재생 응답이
                // 직렬화 규칙(@Exclude)을 벗어나지 않게 저장 전에 적용해 둔다.
                response: instanceToPlain(data),
              } satisfies IdempotencyRecord,
              IDEMPOTENCY_TTL_MS,
            )
            .catch((error: unknown) =>
              this.logger.error(
                `멱등성 응답 저장 실패 (${cacheKey}): ${this.describe(error)}`,
              ),
            );
        },
        error: () => {
          // 실패한 요청은 재시도할 수 있어야 하므로 락을 푼다.
          void this.cacheManager
            .del(cacheKey)
            .catch((error: unknown) =>
              this.logger.error(
                `멱등성 락 해제 실패 (${cacheKey}): ${this.describe(error)}`,
              ),
            );
        },
      }),
    );
  }

  private buildCacheKey(idempotencyKey: string, userId?: number): string {
    return `idempotency:${userId ?? 'anonymous'}:${idempotencyKey}`;
  }

  private describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
