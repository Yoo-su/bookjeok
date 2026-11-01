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
import { type BookSource } from "./sources";
import { createHtmlCache } from "./web/cache";
import { createWebEnricher } from "./web/enrich";
import { createHtmlRequest } from "./web/request";

const requestHtml = createHtmlRequest();
export const enrichFromWeb = createWebEnricher(
  requestHtml,
  createHtmlCache(resolve(DATA_DIR, "web-cache")),
);

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
 * 후보 검색 공급처와 무관하게 알라딘 웹 + YES24 두께로 전 필드를 보강합니다.
 */
export function createIngestDeps(db: BookDb): IngestDeps {
  const store = createR2Store({
    accountId: requireEnv("R2_ACCOUNT_ID"),
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    bucket: process.env.R2_BUCKET?.trim() || "bookjeok-covers",
  });
  const originalsDir = resolve(DATA_DIR, "originals");

  return {
    enrich: enrichFromWeb,
    requireComplete: true,
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
