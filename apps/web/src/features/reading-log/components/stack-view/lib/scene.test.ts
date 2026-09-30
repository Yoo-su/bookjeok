import type { ReadingStackBook } from "@bookjeok/core";
import { describe, expect, it } from "vitest";

import { SAMPLE_BOOKS } from "./sample-books";
import { buildStackScene } from "./scene";
import { stackStatus } from "./status";
import type { SceneColors, SceneItem, TextItem } from "./types";

const COLORS: SceneColors = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
};

/** 글자별 폭(글자 크기 배율). 브라우저에서 Gaegu 700으로 잰 값을 조금 넉넉히 반올림했다 */
const GLYPH: Record<string, number> = { " ": 0.42, ".": 0.34, m: 0.73 };

/** jsdom에는 캔버스가 없어 글자 폭을 어림한다 */
const measure = (text: string, size: number) =>
  [...text].reduce(
    (w, ch) => w + size * (GLYPH[ch] ?? (/[가-힣]/.test(ch) ? 0.82 : 0.5)),
    0,
  );

type Box = { x0: number; y0: number; x1: number; y1: number };
const hits = (a: Box, b: Box) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** 글자가 실제로 칠하는 자리 */
function inkBox(t: TextItem): Box {
  const w = measure(t.t, t.size);
  const x0 =
    t.anchor === "end" ? t.x - w : t.anchor === "middle" ? t.x - w / 2 : t.x;
  return { x0, y0: t.y - t.size * 0.4, x1: x0 + w, y1: t.y + t.size * 0.4 };
}

function find(items: SceneItem[], id: string): SceneItem | undefined {
  for (const it of items) {
    if (it.id === id) return it;
    if (it.k === "g") {
      const f = find(it.children, id);
      if (f) return f;
    }
  }
}

/** 말풍선 몸통(꼬리 제외) */
function bubbleBox(items: SceneItem[]): Box | null {
  const g = find(items, "bubble");
  const body = g?.k === "g" ? g.children[0] : undefined;
  if (body?.k !== "p") return null;
  const pts = [...body.d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [
    Number(m[1]),
    Number(m[2]),
  ]);
  const ys = pts.map((p) => p[1]).sort((a, b) => a - b);
  // 꼬리 끝(가장 아래 점 몇 개)은 폭이 좁아 뺀다
  const bottom = ys[ys.length - 4];
  return {
    x0: Math.min(...pts.map((p) => p[0])),
    y0: ys[0],
    x1: Math.max(...pts.map((p) => p[0])),
    y1: bottom - 11,
  };
}

function booksOf(n: number): ReadingStackBook[] {
  return Array.from({ length: n }, (_, i) => ({
    ...SAMPLE_BOOKS[i % SAMPLE_BOOKS.length],
    logId: String(i + 1),
  }));
}

describe("독서 키재기 이름표 배치", () => {
  it("폭·키·쌓은 높이가 어떻든 내 키와 쌓은 높이가 겹치지 않고, 쌓은 높이는 꼭대기 옆에 있다", () => {
    const failures: string[] = [];
    for (const width of [262, 300, 332, 420, 642])
      for (const height of [520, 600])
        for (const n of [3, 6, 19, 46, 92]) {
          const books = booksOf(n);
          const stackMm = books.reduce((a, b) => a + b.depth, 0);
          const stackCm = Math.round(stackMm / 10);
          const heights = new Set(
            [-20, -8, -4, -2, -1, 0, 1, 2, 4, 8, 20]
              .map((d) => stackCm + d)
              .concat([173])
              .filter((cm) => cm >= 80 && cm <= 230),
          );
          for (const cm of heights) {
            const userMm = cm * 10;
            const { items, stack } = buildStackScene({
              width,
              height,
              books,
              stackMm,
              userMm,
              character: "M",
              status: stackStatus(stackMm, userMm),
              labels: {
                myHeight: `내 키 ${cm}cm`,
                remain: `${Math.ceil((userMm - stackMm) / 10)}cm 남음`,
                approxBooks: "약 10권",
                stackHeight: `${(stackMm / 10).toFixed(1)}cm`,
                bubble: ["무릎은 넘었다!", "허리까지 9cm"],
              },
              colors: COLORS,
              measure,
            });
            const my = find(items, "my-height");
            const sh = find(items, "stack-height");
            if (my?.k !== "t" || sh?.k !== "t") {
              failures.push(`${width}×${height} ${n}권 키 ${cm}: 이름표 없음`);
              continue;
            }
            const found: string[] = [];
            const myBox = inkBox(my);
            const shBox = inkBox(sh);
            if (hits(myBox, shBox)) found.push("내 키↔쌓은 높이");
            const bubble = bubbleBox(items);
            if (bubble && hits(myBox, bubble)) found.push("내 키↔말풍선");
            if (bubble && hits(shBox, bubble)) found.push("쌓은 높이↔말풍선");
            // 겹칠 때만 조금 비키므로 꼭대기에서 글자 한 줄 넘게 떨어지면 안 된다
            if (Math.abs(sh.y - stack.top) > sh.size + 4)
              found.push(
                `쌓은 높이가 꼭대기에서 ${Math.round(sh.y - stack.top)}px`,
              );
            if (found.length)
              failures.push(
                `${width}×${height} ${n}권 키 ${cm}: ${found.join(", ")}`,
              );
          }
        }
    expect(failures).toEqual([]);
  });
});
