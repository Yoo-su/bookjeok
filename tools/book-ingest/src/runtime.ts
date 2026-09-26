import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { cdnBase, DATA_DIR, requireEnv } from "./config";
import { downloadCover, prepareCover } from "./cover";
import { coverColor } from "./cover-color";
import { type BookDb, createBookDb } from "./db";
import { fetchWithRetry } from "./http";
import type { IngestDeps } from "./ingest";
import { withListCache } from "./list-cache";
import { createR2Store } from "./r2";
import type { ScanDeps } from "./scan";
import { type BookSource, dimensionLender } from "./sources";

export function openDb(): BookDb {
  return createBookDb(requireEnv("INGEST_DATABASE_URL"));
}

/** 지난 주차 목록은 `.data/list-cache`에서 다시 씁니다(쿼터 절약·이어 하기). */
export function createScanDeps(db: BookDb, source: BookSource): ScanDeps {
  return {
    source: withListCache(source, resolve(DATA_DIR, "list-cache")),
    findExisting: (isbns) => db.findExisting(isbns),
  };
}

/**
 * R2 자격증명은 적재할 때만 필요합니다. 조회만 할 때는 없어도 됩니다.
 *
 * 판형을 주지 않는 공급처(카카오)의 책은 판형을 주는 공급처(알라딘)에서 ISBN으로
 * 빌려 옵니다. 빌려 줄 곳의 키가 없으면 판형 없이 표지색만 넣습니다.
 */
export function createIngestDeps(
  db: BookDb,
  sources: Map<string, BookSource>,
): IngestDeps {
  const store = createR2Store({
    accountId: requireEnv("R2_ACCOUNT_ID"),
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    bucket: process.env.R2_BUCKET?.trim() || "bookjeok-covers",
  });
  const originalsDir = resolve(DATA_DIR, "originals");

  return {
    async enrich(book) {
      const source = sources.get(book.source);
      if (!source) throw new Error(`공급처 ${book.source}의 키가 없습니다`);
      const enriched = source.enrich ? await source.enrich(book) : book;
      const lender = dimensionLender(sources, source.id);
      if (!lender?.lookupDimensions) return enriched;
      return {
        ...enriched,
        dimensions: await lender.lookupDimensions(enriched.isbn),
      };
    },
    downloadCover,
    prepareCover,
    async saveOriginal(isbn, body, ext) {
      await mkdir(originalsDir, { recursive: true });
      await writeFile(resolve(originalsDir, `${isbn}.${ext}`), body);
    },
    store,
    async verifyPublic(url) {
      const res = await fetchWithRetry(url, { method: "HEAD" });
      return res.status === 200;
    },
    coverColor,
    insertBook: (row, dimension) => db.insertBook(row, dimension),
    preflight: () => db.assertWritable(),
    cdnBase: cdnBase(),
  };
}
