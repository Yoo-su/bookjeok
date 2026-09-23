import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const TOOL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = resolve(TOOL_ROOT, "../..");

/** 실행 산출물(표지 원본·실행 기록·즐겨찾기). gitignore 대상. */
export const DATA_DIR = resolve(TOOL_ROOT, ".data");

/**
 * 도구 전용 `.env`를 먼저, 저장소 루트 `.env`를 나중에 읽습니다.
 * `loadEnvFile`은 이미 있는 값을 덮지 않으므로 도구 쪽 값이 이깁니다.
 */
export function loadEnv(): void {
  for (const file of [resolve(TOOL_ROOT, ".env"), resolve(REPO_ROOT, ".env")]) {
    if (existsSync(file)) process.loadEnvFile(file);
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name}이(가) 없습니다. tools/book-ingest/.env.example을 참고해 .env에 넣어 주세요.`,
    );
  }
  return value;
}

export function cdnBase(): string {
  return (process.env.INGEST_CDN_BASE ?? "https://cdn.bookjeok.com").replace(
    /\/+$/,
    "",
  );
}

/** 접속 문자열에서 자격증명을 뺀 요약. 로그에는 이것만 남깁니다. */
export function describeDatabase(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return "(파싱 불가)";
  }
}
