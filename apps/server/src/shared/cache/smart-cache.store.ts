import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

/**
 * prefix 하나가 들고 있을 수 있는 키 수 상한.
 * 검색어처럼 키가 입력마다 새로 생기는 캐시는, 기본 메모리 저장소가 만료 항목을
 * 조회될 때만 지우므로 쓰기가 없으면 끝없이 쌓인다. 넘으면 그 prefix를 비우고 다시 채운다.
 */
const MAX_KEYS_PER_PREFIX = 1000;

@Injectable()
export class SmartCacheStore {
  private readonly logger = new Logger(SmartCacheStore.name);

  // prefix별로 캐시 키 목록을 인메모리에 저장하여 쉽게 삭제할 수 있도록 합니다.
  private prefixKeyMap: Map<string, Set<string>> = new Map();

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async set<T>(
    prefix: string,
    key: string,
    value: T,
    ttl?: number,
  ): Promise<void> {
    const keys = this.prefixKeyMap.get(prefix);
    if (keys && !keys.has(key) && keys.size >= MAX_KEYS_PER_PREFIX) {
      await this.invalidateByPrefix(prefix);
    }

    await this.cacheManager.set(key, value, ttl);

    if (!this.prefixKeyMap.has(prefix)) {
      this.prefixKeyMap.set(prefix, new Set());
    }
    this.prefixKeyMap.get(prefix)!.add(key);
  }

  async get<T>(key: string): Promise<T | undefined | null> {
    return await this.cacheManager.get<T>(key);
  }

  async invalidateByPrefix(prefix: string): Promise<void> {
    const keys = this.prefixKeyMap.get(prefix);
    if (!keys || keys.size === 0) return;

    const deletionPromises = Array.from(keys).map((key) =>
      this.cacheManager.del(key).catch((error: unknown) => {
        this.logger.error(
          `캐시 키 삭제 실패 (prefix: ${prefix}, key: ${key}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }),
    );

    await Promise.all(deletionPromises);

    // 메모리 누수 방지
    this.prefixKeyMap.delete(prefix);
  }
}
