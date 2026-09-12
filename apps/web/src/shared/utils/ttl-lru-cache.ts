/**
 * TTL + 최대 항목 수를 함께 두는 인메모리 캐시.
 *
 * Fluid 인스턴스는 오래 살아서, eviction 없는 Map은 크롤 트래픽을 그대로 힙에 쌓는다.
 * (경로 공간이 카탈로그 크기라 상한이 사실상 없다)
 */
export class TtlLruCache<T> {
  private readonly store = new Map<string, { data: T; expiresAt: number }>();

  constructor(
    private readonly maxEntries: number,
    private readonly ttlMs: number,
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // 최근 사용으로 올리려면 삽입 순서를 다시 세워야 함
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.data;
  }

  set(key: string, data: T): void {
    // 갱신도 최근 사용으로 취급
    this.store.delete(key);
    this.store.set(key, { data, expiresAt: Date.now() + this.ttlMs });

    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next();
      if (oldest.done) break;
      this.store.delete(oldest.value);
    }
  }

  get size(): number {
    return this.store.size;
  }
}
