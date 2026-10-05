import { CallHandler, ExecutionContext, HttpStatus } from '@nestjs/common';
import { Cache, createCache } from 'cache-manager';
import { defer, lastValueFrom, Observable, of, throwError } from 'rxjs';

import { BusinessException } from '@/shared/exceptions';

import { IdempotencyInterceptor } from './idempotency.interceptor';

const contextFor = (key?: string, userId = 1): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: key ? { 'x-idempotency-key': key } : {},
        user: { id: userId },
      }),
    }),
  }) as unknown as ExecutionContext;

const handlerReturning = (
  produce: () => Observable<unknown>,
): { next: CallHandler; calls: () => number } => {
  let calls = 0;
  return {
    next: {
      handle: () =>
        defer(() => {
          calls += 1;
          return produce();
        }),
    },
    calls: () => calls,
  };
};

const run = async (
  interceptor: IdempotencyInterceptor,
  context: ExecutionContext,
  next: CallHandler,
): Promise<unknown> =>
  lastValueFrom(await interceptor.intercept(context, next));

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('IdempotencyInterceptor', () => {
  let cache: Cache;
  let interceptor: IdempotencyInterceptor;

  beforeEach(() => {
    cache = createCache();
    interceptor = new IdempotencyInterceptor(cache);
  });

  it('runs the handler once for concurrent requests with the same key', async () => {
    const handler = handlerReturning(() => of({ id: 1 }));

    const results = await Promise.allSettled([
      run(interceptor, contextFor('k1'), handler.next),
      run(interceptor, contextFor('k1'), handler.next),
    ]);

    expect(handler.calls()).toBe(1);
    expect(results.map((r) => r.status).sort()).toEqual([
      'fulfilled',
      'rejected',
    ]);
    const rejected = results.find(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );
    expect(rejected?.reason).toBeInstanceOf(BusinessException);
    expect((rejected?.reason as BusinessException).getStatus()).toBe(
      HttpStatus.CONFLICT,
    );
  });

  it('replays the first response for a completed key without running the handler', async () => {
    const handler = handlerReturning(() => of({ id: 1 }));

    await run(interceptor, contextFor('k1'), handler.next);
    await flush();
    const replayed = await run(interceptor, contextFor('k1'), handler.next);

    expect(replayed).toEqual({ id: 1 });
    expect(handler.calls()).toBe(1);
  });

  it('lets the same key retry after a failed request', async () => {
    let fail = true;
    const handler = handlerReturning(() =>
      fail ? throwError(() => new Error('boom')) : of({ id: 2 }),
    );

    await expect(
      run(interceptor, contextFor('k1'), handler.next),
    ).rejects.toThrow('boom');
    await flush();
    fail = false;

    await expect(
      run(interceptor, contextFor('k1'), handler.next),
    ).resolves.toEqual({ id: 2 });
    expect(handler.calls()).toBe(2);
  });

  it('isolates keys per user', async () => {
    const handler = handlerReturning(() => of({ ok: true }));

    await Promise.all([
      run(interceptor, contextFor('k1', 1), handler.next),
      run(interceptor, contextFor('k1', 2), handler.next),
    ]);

    expect(handler.calls()).toBe(2);
  });

  it('passes requests without a key straight through', async () => {
    const handler = handlerReturning(() => of({ ok: true }));

    await Promise.all([
      run(interceptor, contextFor(), handler.next),
      run(interceptor, contextFor(), handler.next),
    ]);

    expect(handler.calls()).toBe(2);
  });

  it('releases the acquisition when the cache lookup fails', async () => {
    const handler = handlerReturning(() => of({ ok: true }));
    jest.spyOn(cache, 'get').mockRejectedValueOnce(new Error('cache down'));

    await expect(
      run(interceptor, contextFor('k1'), handler.next),
    ).rejects.toThrow('cache down');
    await expect(
      run(interceptor, contextFor('k1'), handler.next),
    ).resolves.toEqual({ ok: true });
  });
});
