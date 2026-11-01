import { kakaoSource } from "./kakao";
import type { BookSource, ListCatalog, SourceDefinition } from "./types";

export type {
  BookSource,
  KeywordQuery,
  ListCatalog,
  ListQuery,
  ListWeek,
  SearchField,
  SearchSort,
  SourceDefinition,
  SourcePage,
} from "./types";

/** 첫 항목이 기본 공급처입니다. */
export const SOURCES: SourceDefinition[] = [kakaoSource];

export interface SourceInfo {
  id: string;
  label: string;
  maxPages: number;
  available: boolean;
  envKey: string;
  enrichNote: string | null;
  /** 이 공급처로 적재할 때 `book_dimensions`에 무엇이 들어가는지. */
  dimensionNote: string;
  /** 베스트셀러 같은 목록을 주면 그 종류·분야. */
  lists: ListCatalog | null;
}

export function describeSources(
  env: NodeJS.ProcessEnv = process.env,
): SourceInfo[] {
  const sources = createSources(env);
  return SOURCES.map(
    ({ id, label, maxPages, envKey, enrichNote, listCatalog }) => {
      return {
        id,
        label,
        maxPages,
        envKey,
        enrichNote:
          enrichNote ??
          "선택한 신규 책만 알라딘 웹에서 서지·표지·긴 소개를, YES24에서 두께를 받습니다. 받은 상세는 24시간 캐시합니다.",
        available: sources.has(id),
        lists: listCatalog ?? null,
        dimensionNote:
          "두께는 YES24, 나머지 판형은 알라딘 값입니다. 필수 정보가 빠지면 적재하지 않습니다.",
      };
    },
  );
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
