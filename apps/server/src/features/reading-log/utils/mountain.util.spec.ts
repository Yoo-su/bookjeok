import { MOUNTAIN_MAX_BANDS } from '@bookjeok/core';

import { buildMountain, MountainRow, mountainShareOf } from './mountain.util';

const row = (
  i: number,
  over: Partial<MountainRow> = {},
  createdAt = new Date('2026-09-20T00:00:00Z'),
): MountainRow => ({
  id: `log-${i}`,
  isbn: `97889000000${String(i).padStart(2, '0')}`,
  userId: 1,
  createdAt,
  width: 150,
  height: 220,
  depth: 20,
  coverColor: '#112233',
  ...over,
});

describe('buildMountain', () => {
  const weekSince = new Date('2026-09-23T00:00:00Z');

  it('두께를 더하고 기록한 사람을 센다', () => {
    const m = buildMountain(
      [row(1), row(2, { userId: 2 }), row(3, { depth: 35 })],
      weekSince,
    );

    expect(m.totalMm).toBe(75);
    expect(m.readerCount).toBe(2);
    expect(m.bands).toEqual([
      { mm: 20, color: '#112233' },
      { mm: 20, color: '#112233' },
      { mm: 35, color: '#112233' },
    ]);
  });

  it('두께가 없으면 추정하고, 표지색이 없으면 대체색을 쓴다', () => {
    const m = buildMountain(
      [row(1, { depth: null, pages: 300, coverColor: null })],
      weekSince,
    );

    expect(m.totalMm).toBeGreaterThan(10);
    expect(m.bands[0].color).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('이번 주 올린 것만 따로 센다', () => {
    const m = buildMountain(
      [row(1), row(2, {}, new Date('2026-09-29T00:00:00Z'))],
      weekSince,
    );

    expect(m.weekMm).toBe(20);
    expect(m.weekCount).toBe(1);
  });

  it('이정표마다 그 높이를 처음 넘긴 기록을 남긴다', () => {
    // 20mm씩 58권째에 1160mm로 황제펭귄(1150), 150mm 한 권을 끼워 146권째에 농구 골대(3050)
    const rows = Array.from({ length: 60 }, (_, i) => row(i));
    rows.push(row(60, { depth: 150 }));
    for (let i = 61; i < 150; i++) rows.push(row(i));

    const m = buildMountain(rows, weekSince);

    expect(m.crossings.map((c) => [c.landmark, c.book.row.id])).toEqual([
      ['emperor', 'log-57'],
      ['hoop', 'log-145'],
    ]);
  });

  it('띠가 너무 많으면 이웃한 책을 묶되 높이는 그대로다', () => {
    const rows = Array.from({ length: MOUNTAIN_MAX_BANDS * 2 + 1 }, (_, i) =>
      row(i),
    );

    const m = buildMountain(rows, weekSince);

    expect(m.bands.length).toBeLessThanOrEqual(MOUNTAIN_MAX_BANDS);
    expect(m.bands.reduce((a, b) => a + b.mm, 0)).toBe(m.totalMm);
  });

  it('기록이 없으면 빈 책동산이다', () => {
    const m = buildMountain([], weekSince);

    expect(m).toMatchObject({ totalMm: 0, readerCount: 0, bands: [] });
    expect(m.crossings).toEqual([]);
  });
});

describe('mountainShareOf', () => {
  it('그 사람이 올린 책의 두께와 권수만 더한다', () => {
    const { books } = buildMountain(
      [row(1), row(2, { userId: 2, depth: 50 }), row(3, { depth: 35 })],
      new Date(),
    );

    expect(mountainShareOf(books, 1)).toEqual({ mm: 55, count: 2 });
    expect(mountainShareOf(books, 3)).toEqual({ mm: 0, count: 0 });
  });
});
