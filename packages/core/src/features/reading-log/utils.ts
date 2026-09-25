import type { BookSizeSource } from "./types";

/**
 * 크기 정보가 없는 책에 쓰는 기본 판형(mm).
 * 알라딘 수확본(2026-09-25, 56,885권)의 중앙값이다(docs/book-data-migration-plan.md 8-f).
 */
export const DEFAULT_BOOK_SIZE = { width: 150, height: 215, depth: 15 } as const;

/** 쪽수로 두께를 추정할 때 한 쪽의 두께(mm). 수확본 적합, 오차 중앙값 0.4mm */
export const BOOK_MM_PER_PAGE = 0.049;

/** 표지 두께(mm). 양장은 보드지라 두껍다. BOOK_MM_PER_PAGE와 같이 적합한 값 */
export const BOOK_COVER_MM = { hard: 6.4, soft: 2.3 } as const;

/** 무게 추정용 밀도(g/mm³). 수확본에서 무게 ÷ 부피의 중앙값 */
const BOOK_DENSITY = 0.0008;

export interface PartialBookSize {
  width?: number | null;
  height?: number | null;
  depth?: number | null;
  pages?: number | null;
  weight?: number | null;
  binding?: string | null;
}

/**
 * 실측값으로 믿을 범위. 벗어나면 결측으로 본다.
 * 알라딘 packing에는 세트 상자·오기(0, 9999 등)가 섞여 있어 그대로 쌓으면 탑이 튄다.
 * `book_dimensions` 적재도 이 범위 밖 값은 NULL로 넣는다(docs/manual-ddl-log.md 11절).
 */
export const BOOK_SIZE_PLAUSIBLE = {
  width: [50, 400],
  height: [80, 450],
  depth: [1, 150],
  pages: [4, 5000],
  weight: [20, 10000],
} as const;

const plausible = (key: keyof typeof BOOK_SIZE_PLAUSIBLE, v: number | null | undefined) =>
  v != null && v >= BOOK_SIZE_PLAUSIBLE[key][0] && v <= BOOK_SIZE_PLAUSIBLE[key][1] ? v : null;

export interface EstimatedBookSize {
  width: number;
  height: number;
  depth: number;
  weight: number;
  /** 믿을 범위 안의 쪽수. 벗어나거나 없으면 null */
  pages: number | null;
  sizeSource: BookSizeSource;
}

/** ISBN으로 정해지는 -1~1 값. 추정 책끼리 똑같은 크기로 쌓이지 않게 흩뜨린다 */
function isbnJitter(isbn: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (const ch of isbn) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 2001) / 1000 - 1;
}

/**
 * 비어 있는 크기 값을 채운다.
 *
 * 세로·가로·두께가 모두 실측이면 "measured", 하나라도 채웠으면 "estimated"다.
 * 두께는 쪽수가 있으면 쪽수로, 없으면 기본값에 ISBN 편차를 줘 만든다.
 */
export function estimateBookSize(isbn: string, raw: PartialBookSize): EstimatedBookSize {
  const known = {
    width: plausible("width", raw.width),
    height: plausible("height", raw.height),
    depth: plausible("depth", raw.depth),
    pages: plausible("pages", raw.pages),
    weight: plausible("weight", raw.weight),
  };
  const hard = raw.binding === "양장본";
  const height = known.height ?? DEFAULT_BOOK_SIZE.height + Math.round(isbnJitter(isbn, 1) * 8);
  const width = known.width ?? Math.round(height * (DEFAULT_BOOK_SIZE.width / DEFAULT_BOOK_SIZE.height));
  const depth =
    known.depth ??
    (known.pages
      ? Math.max(3, Math.round(known.pages * BOOK_MM_PER_PAGE + (hard ? BOOK_COVER_MM.hard : BOOK_COVER_MM.soft)))
      : DEFAULT_BOOK_SIZE.depth + Math.round(isbnJitter(isbn, 2) * 4));
  const weight = known.weight ?? Math.round(width * height * depth * BOOK_DENSITY);
  const measured = known.width != null && known.height != null && known.depth != null;
  return {
    width,
    height,
    depth,
    weight,
    pages: known.pages,
    sizeSource: measured ? "measured" : "estimated",
  };
}

/**
 * 표지색이 없는 책(10/30 이후 신간 등)에 쓰는 색. 전부 회색이면 탑이 밋밋해지므로
 * 채도를 낮춘 색 중에서 ISBN으로 하나 고른다.
 */
const FALLBACK_COVER_PALETTE = [
  "#D9CBB8", "#C9D3C4", "#C8D1DB", "#DCC7C3", "#D8D2C0",
  "#C4CCC9", "#D6C9D6", "#CFC6B8", "#BFC8D2", "#DDD5C8",
] as const;

export function fallbackCoverColor(isbn: string): string {
  const i = Math.floor(((isbnJitter(isbn, 3) + 1) / 2) * FALLBACK_COVER_PALETTE.length);
  return FALLBACK_COVER_PALETTE[Math.min(FALLBACK_COVER_PALETTE.length - 1, i)];
}

/** 배경색 위에 올릴 글자색(먹색 또는 흰색) */
export function inkColorFor(background: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(background);
  if (!m) return "#1C1917";
  const n = parseInt(m[1], 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  // 먹색(#1C1917, L≈0.01)과 흰색(#F6F2EA, L≈0.89) 중 대비가 큰 쪽
  return (L + 0.05) / 0.06 >= 0.94 / (L + 0.05) ? "#1C1917" : "#F6F2EA";
}
