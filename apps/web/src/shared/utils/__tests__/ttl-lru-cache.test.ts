import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TtlLruCache } from "../ttl-lru-cache";

describe("TtlLruCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("저장한 값을 그대로 돌려준다", () => {
    const cache = new TtlLruCache<number>(10, 1000);
    cache.set("a", 1);

    expect(cache.get("a")).toBe(1);
  });

  it("없는 키는 undefined", () => {
    const cache = new TtlLruCache<number>(10, 1000);

    expect(cache.get("missing")).toBeUndefined();
  });

  it("TTL이 지나면 만료되고 항목도 비운다", () => {
    const cache = new TtlLruCache<number>(10, 1000);
    cache.set("a", 1);

    vi.advanceTimersByTime(1000);

    expect(cache.get("a")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("최대 항목 수를 넘기면 가장 오래 안 쓴 항목부터 버린다", () => {
    const cache = new TtlLruCache<number>(2, 1000);
    cache.set("a", 1);
    cache.set("b", 2);

    // a를 다시 읽어 최근 사용으로 올린다
    cache.get("a");
    cache.set("c", 3);

    expect(cache.size).toBe(2);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
  });

  it("같은 키를 다시 쓰면 항목이 늘지 않는다", () => {
    const cache = new TtlLruCache<number>(2, 1000);
    cache.set("a", 1);
    cache.set("a", 2);

    expect(cache.size).toBe(1);
    expect(cache.get("a")).toBe(2);
  });

  it("크롤 트래픽을 흉내내도 상한을 넘지 않는다", () => {
    const cache = new TtlLruCache<number>(500, 1000);
    for (let i = 0; i < 50_000; i++) {
      cache.set(`isbn-${i}`, i);
    }

    expect(cache.size).toBe(500);
  });
});
