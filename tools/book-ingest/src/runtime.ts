import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { cdnBase, DATA_DIR, requireEnv } from "./config";
import { downloadCover, prepareCover } from "./cover";
import { type BookDb, createBookDb } from "./db";
import { fetchWithRetry } from "./http";
import type { IngestDeps } from "./ingest";
import { createR2Store } from "./r2";
import type { ScanDeps } from "./scan";
import type { BookSource } from "./sources";

export function openDb(): BookDb {
  return createBookDb(requireEnv("INGEST_DATABASE_URL"));
}

export function createScanDeps(db: BookDb, source: BookSource): ScanDeps {
  return { source, findExisting: (isbns) => db.findExisting(isbns) };
}

/** R2 자격증명은 적재할 때만 필요합니다. 조회만 할 때는 없어도 됩니다. */
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
      return source.enrich ? source.enrich(book) : book;
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
    insertBook: (row) => db.insertBook(row),
    cdnBase: cdnBase(),
  };
}
