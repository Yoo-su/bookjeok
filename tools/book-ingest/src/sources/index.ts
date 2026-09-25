import { aladinSource } from "./aladin";
import { kakaoSource } from "./kakao";
import type { BookSource, SourceDefinition } from "./types";

export type {
  BookSource,
  KeywordQuery,
  SearchField,
  SearchSort,
  SourceDefinition,
  SourcePage,
} from "./types";

/** 첫 항목이 기본 공급처입니다. */
export const SOURCES: SourceDefinition[] = [kakaoSource, aladinSource];

export interface SourceInfo {
  id: string;
  label: string;
  maxPages: number;
  available: boolean;
  envKey: string;
  enrichNote: string | null;
  /** 이 공급처로 적재할 때 `book_dimensions`에 무엇이 들어가는지. */
  dimensionNote: string;
}

export function describeSources(
  env: NodeJS.ProcessEnv = process.env,
): SourceInfo[] {
  const sources = createSources(env);
  return SOURCES.map(({ id, label, maxPages, envKey, enrichNote }) => {
    const own = sources.get(id)?.lookupDimensions;
    const lender = dimensionLender(sources, id);
    return {
      id,
      label,
      maxPages,
      envKey,
      enrichNote: enrichNote ?? null,
      available: sources.has(id),
      dimensionNote: own
        ? "판형·쪽수와 표지색을 book_dimensions에 넣습니다."
        : lender
          ? `판형·쪽수는 ${lender.label}에서 ISBN으로 찾아 넣고, 표지색은 표지에서 뽑습니다.`
          : "판형·쪽수를 받을 곳이 없어 표지색만 넣습니다. 크기는 서버가 추정합니다.",
    };
  });
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

/**
 * 판형을 주지 않는 공급처의 책에 판형을 빌려 줄 공급처. 스스로 판형을 받는
 * 공급처(보강 조회에서 함께 받음)거나 빌려 줄 곳이 없으면 null.
 */
export function dimensionLender(
  sources: Map<string, BookSource>,
  sourceId: string,
): BookSource | null {
  if (sources.get(sourceId)?.lookupDimensions) return null;
  return [...sources.values()].find((s) => s.lookupDimensions) ?? null;
}

export const imageOrigins = (): string[] =>
  SOURCES.flatMap((s) => s.imageOrigins);
