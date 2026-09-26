import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { withListCache } from "../list-cache";
import type { BookSource, ListQuery } from "../sources";
import { LIST_CATALOG } from "./fixtures";

let dir: string | undefined;
afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true });
  dir = undefined;
});

async function setup(items: unknown[] = [{ isbn13: "9788932027265" }]) {
  dir = await mkdtemp(join(tmpdir(), "list-cache-"));
  const search = vi.fn(async () => ({ items, totalCount: 1000, isEnd: false }));
  const source = {
    id: "aladin",
    lists: { catalog: LIST_CATALOG, search },
  } as unknown as BookSource;
  return { cached: withListCache(source, dir), search };
}

const past: ListQuery = {
  type: "Bestseller",
  categoryId: "0",
  week: { year: 2015, month: 6, week: 1 },
};

describe("withListCache", () => {
  it("지난 주차 페이지는 한 번만 받는다", async () => {
    const { cached, search } = await setup();
    const first = await cached.lists!.search(past, 1);
    const second = await cached.lists!.search(past, 1);
    expect(second).toEqual(first);
    expect(search).toHaveBeenCalledTimes(1);
    // 페이지·분야가 다르면 따로 받는다
    await cached.lists!.search(past, 2);
    await cached.lists!.search({ ...past, categoryId: "1" }, 1);
    expect(search).toHaveBeenCalledTimes(3);
  });

  it("이번 주 목록은 바뀌므로 남기지 않는다", async () => {
    const { cached, search } = await setup();
    const now = { ...past, week: null };
    await cached.lists!.search(now, 1);
    await cached.lists!.search(now, 1);
    expect(search).toHaveBeenCalledTimes(2);
    expect(await readdir(dir!).catch(() => [])).toEqual([]);
  });

  it("빈 페이지는 남기지 않는다 — 아직 오지 않은 주차일 수 있다", async () => {
    const { cached, search } = await setup([]);
    await cached.lists!.search(past, 1);
    await cached.lists!.search(past, 1);
    expect(search).toHaveBeenCalledTimes(2);
  });
});
