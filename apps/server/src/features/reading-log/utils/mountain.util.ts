import {
  estimateBookSize,
  fallbackCoverColor,
  LoungeMountainBand,
  MOUNTAIN_LANDMARKS,
  MOUNTAIN_MAX_BANDS,
  MountainLandmarkId,
  PartialBookSize,
} from '@bookjeok/core';

/** 책동산에 올린 기록 한 건. 올린 순서(createdAt 오름차순)로 들어온다 */
export interface MountainRow extends PartialBookSize {
  id: string;
  isbn: string;
  userId: number;
  createdAt: Date;
  coverColor?: string | null;
}

export interface MountainBook {
  row: MountainRow;
  height: number;
  depth: number;
}

export interface MountainTotals {
  books: MountainBook[];
  totalMm: number;
  readerCount: number;
  weekMm: number;
  weekCount: number;
  bands: LoungeMountainBand[];
  /** 이정표마다 그 높이를 처음 넘긴 기록 */
  crossings: { landmark: MountainLandmarkId; book: MountainBook }[];
}

/**
 * 기록 목록을 책동산 하나로 합친다. 두께가 없는 책은 `estimateBookSize`로 채운다.
 * 띠는 한 권에 하나이고, `MOUNTAIN_MAX_BANDS`를 넘으면 이웃한 책을 묶는다(색은 가운데 책).
 */
export function buildMountain(rows: MountainRow[], weekSince: Date) {
  const books: MountainBook[] = rows.map((row) => {
    const size = estimateBookSize(row.isbn, row);
    return { row, height: size.height, depth: size.depth };
  });

  let totalMm = 0;
  let weekMm = 0;
  let weekCount = 0;
  let li = 0;
  const readers = new Set<number>();
  const crossings: MountainTotals['crossings'] = [];
  for (const b of books) {
    totalMm += b.depth;
    readers.add(b.row.userId);
    if (b.row.createdAt >= weekSince) {
      weekMm += b.depth;
      weekCount += 1;
    }
    while (
      li < MOUNTAIN_LANDMARKS.length &&
      totalMm >= MOUNTAIN_LANDMARKS[li].heightMm
    ) {
      crossings.push({ landmark: MOUNTAIN_LANDMARKS[li].id, book: b });
      li += 1;
    }
  }

  const per = Math.max(1, Math.ceil(books.length / MOUNTAIN_MAX_BANDS));
  const bands: LoungeMountainBand[] = [];
  for (let i = 0; i < books.length; i += per) {
    const group = books.slice(i, i + per);
    const mid = group[Math.floor(group.length / 2)].row;
    bands.push({
      mm: group.reduce((a, b) => a + b.depth, 0),
      color: mid.coverColor ?? fallbackCoverColor(mid.isbn),
    });
  }

  return {
    books,
    totalMm,
    readerCount: readers.size,
    weekMm,
    weekCount,
    bands,
    crossings,
  } satisfies MountainTotals;
}

/** 책동산에서 한 사람이 올린 책의 두께 합과 권수 */
export function mountainShareOf(books: MountainBook[], userId: number) {
  let mm = 0;
  let count = 0;
  for (const b of books) {
    if (b.row.userId !== userId) continue;
    mm += b.depth;
    count += 1;
  }
  return { mm, count };
}
