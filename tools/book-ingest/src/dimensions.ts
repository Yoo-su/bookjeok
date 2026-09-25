import { BOOK_SIZE_PLAUSIBLE } from "@bookjeok/core";

/**
 * `book_dimensions`에 넣을 실측 판형. mm·쪽·g이며 모르면 null.
 * 규칙은 운영 적재(`apply-dimensions.mjs`)와 같습니다 — docs/manual-ddl-log.md 11절.
 */
export interface BookDimensions {
  /** 값을 준 공급처. 실행 기록용이며 DB에는 넣지 않습니다. */
  source: string;
  width: number | null;
  height: number | null;
  depth: number | null;
  pages: number | null;
  weight: number | null;
  /** 양장본·반양장본 등. */
  binding: string | null;
}

export interface RawDimensions {
  width?: unknown;
  height?: unknown;
  depth?: unknown;
  pages?: unknown;
  weight?: unknown;
  binding?: unknown;
}

const NUMERIC = ["width", "height", "depth", "pages", "weight"] as const;

/** `binding`은 `varchar(20)`입니다. */
const MAX_BINDING = 20;

const positive = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

/**
 * 공급처 값을 `book_dimensions` 규칙으로 정리합니다. 남는 값이 하나도 없으면 null.
 * - 0·음수는 결측입니다.
 * - 가로·세로가 뒤바뀐 원본이 있어 큰 값을 height로 둡니다.
 * - core `BOOK_SIZE_PLAUSIBLE` 밖은 NULL입니다. 컬럼이 smallint라 오기 한 건이 INSERT를 깹니다.
 * - 제본명 `미확인`과 20자 초과는 버립니다.
 */
export function toDimensions(
  source: string,
  raw: RawDimensions,
): BookDimensions | null {
  const w = positive(raw.width);
  const h = positive(raw.height);
  const values: Record<(typeof NUMERIC)[number], number | null> = {
    width: w && h ? Math.min(w, h) : w,
    height: w && h ? Math.max(w, h) : h,
    depth: positive(raw.depth),
    pages: positive(raw.pages),
    weight: positive(raw.weight),
  };
  for (const key of NUMERIC) {
    const v = values[key];
    const [min, max] = BOOK_SIZE_PLAUSIBLE[key];
    if (v !== null && (v < min || v > max)) values[key] = null;
  }
  const text = typeof raw.binding === "string" ? raw.binding.trim() : "";
  const binding =
    text && text !== "미확인" && text.length <= MAX_BINDING ? text : null;

  if (NUMERIC.every((key) => values[key] === null) && binding === null) {
    return null;
  }
  return { source, ...values, binding };
}

/** 가로·세로·두께·쪽수·무게 중 하나라도 있는지. 제본명만으로는 행을 만들지 않습니다. */
export const hasMeasurement = (d: BookDimensions | null): boolean =>
  d !== null && NUMERIC.some((key) => d[key] !== null);

/** 로그 한 줄용. `152×223×17mm · 297쪽 · 440g · 반양장본` */
export function formatDimensions(d: BookDimensions): string {
  const size =
    d.width && d.height
      ? `${d.width}×${d.height}${d.depth ? `×${d.depth}` : ""}mm`
      : d.depth
        ? `두께 ${d.depth}mm`
        : null;
  return [
    size,
    d.pages && `${d.pages}쪽`,
    d.weight && `${d.weight}g`,
    d.binding,
  ]
    .filter(Boolean)
    .join(" · ");
}
