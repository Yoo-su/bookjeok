import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { BookSource, ListQuery, SourcePage } from "./sources";

/**
 * 지난 주차 목록 페이지를 로컬에 남깁니다. 지난 베스트셀러는 바뀌지 않으므로 다시 받지 않습니다.
 * 알라딘 쿼터(하루 5,000회)로 긴 기간을 하루에 못 훑으니, 다음 날 같은 조회가 캐시에서 이어집니다.
 * 이번 주 목록(`week`가 null)과 빈 페이지(아직 오지 않은 주차일 수 있음)는 남기지 않습니다.
 */
export function withListCache<Raw>(
  source: BookSource<Raw>,
  dir: string,
): BookSource<Raw> {
  const lists = source.lists;
  if (!lists) return source;

  const pathOf = (query: ListQuery, page: number) => {
    const key = JSON.stringify([
      source.id,
      query.type,
      query.categoryId,
      query.week,
      page,
    ]);
    return resolve(dir, `${createHash("sha1").update(key).digest("hex")}.json`);
  };

  return {
    ...source,
    lists: {
      ...lists,
      async search(query, page) {
        if (!query.week) return lists.search(query, page);
        const path = pathOf(query, page);
        try {
          return JSON.parse(await readFile(path, "utf8")) as SourcePage<Raw>;
        } catch {
          // 없거나 깨진 캐시는 새로 받습니다
        }
        const result = await lists.search(query, page);
        if (result.items.length > 0) {
          await mkdir(dir, { recursive: true });
          await writeFile(path, JSON.stringify(result));
        }
        return result;
      },
    },
  };
}
