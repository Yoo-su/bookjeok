import { Cache } from 'cache-manager';

import { SmartCacheStore } from './smart-cache.store';

const makeCache = () => {
  const map = new Map<string, unknown>();
  return {
    map,
    cache: {
      set: jest.fn((key: string, value: unknown) => {
        map.set(key, value);
        return Promise.resolve(value);
      }),
      get: jest.fn((key: string) => Promise.resolve(map.get(key))),
      del: jest.fn((key: string) => Promise.resolve(map.delete(key))),
    } as unknown as Cache,
  };
};

describe('SmartCacheStore', () => {
  it('prefix의 키가 상한에 닿으면 그 prefix를 비우고 새 키를 넣는다', async () => {
    const { map, cache } = makeCache();
    const store = new SmartCacheStore(cache);

    for (let i = 0; i < 1000; i++) {
      await store.set('review-tags', `review-tags:q${i}`, [i]);
    }
    await store.set('reviews-popular', 'reviews-popular:global', ['p']);
    expect(map.size).toBe(1001);

    await store.set('review-tags', 'review-tags:new', ['n']);

    expect(map.has('review-tags:q0')).toBe(false);
    expect(map.get('review-tags:new')).toEqual(['n']);
    // 다른 prefix는 건드리지 않는다
    expect(map.get('reviews-popular:global')).toEqual(['p']);
    expect(map.size).toBe(2);
  });

  it('이미 있는 키를 다시 쓰는 것은 상한에 걸리지 않는다', async () => {
    const { map, cache } = makeCache();
    const store = new SmartCacheStore(cache);

    for (let i = 0; i < 1000; i++) {
      await store.set('review-tags', `review-tags:q${i}`, [i]);
    }
    await store.set('review-tags', 'review-tags:q5', ['again']);

    expect(map.size).toBe(1000);
  });
});
