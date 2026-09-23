import { aladinSource } from "./aladin";
import { kakaoSource } from "./kakao";
import type { BookSource, SourceDefinition } from "./types";

export type { BookSource, SourceDefinition, SourcePage } from "./types";

/** 첫 항목이 기본 공급처입니다. */
export const SOURCES: SourceDefinition[] = [kakaoSource, aladinSource];

export interface SourceInfo {
  id: string;
  label: string;
  maxPages: number;
  available: boolean;
  envKey: string;
  enrichNote: string | null;
}

export function describeSources(
  env: NodeJS.ProcessEnv = process.env,
): SourceInfo[] {
  return SOURCES.map(({ id, label, maxPages, envKey, enrichNote }) => ({
    id,
    label,
    maxPages,
    envKey,
    enrichNote: enrichNote ?? null,
    available: Boolean(env[envKey]?.trim()),
  }));
}

/** 키가 있는 공급처만 만듭니다. 키가 없는 공급처는 화면에서 비활성으로 보입니다. */
export function createSources(
  env: NodeJS.ProcessEnv = process.env,
): Map<string, BookSource> {
  const sources = new Map<string, BookSource>();
  for (const definition of SOURCES) {
    const key = env[definition.envKey]?.trim();
    if (key) sources.set(definition.id, definition.create(key));
  }
  return sources;
}

export const imageOrigins = (): string[] =>
  SOURCES.flatMap((s) => s.imageOrigins);
