import { f1, hashSeed, poly, rectCorners, rng, sketchPoly } from "./sketch";
import type { MeasureText, SceneColors, SceneItem } from "./types";

/**
 * 공유 이미지 바닥에 적는 「쌓은 책」 목록. 차트의 범례처럼 제목마다 탑과 같은
 * 손그림 책을 표지색으로 붙여, 화살표 없이도 탑의 책과 이어 보이게 한다.
 */

export interface LegendBook {
  id: string;
  title: string;
  color: string;
}

/** 목록에 적을 수 있는 최대 권수. 넘으면 두 줄을 넘겨 장면이 너무 줄어든다 */
export const LEGEND_MAX = 5;

/** 글자 크기·줄 높이·간격(u 배율 전). 글자는 무대의 손글씨 주석(16u)과 맞춘다 */
const HEAD = 16;
const ROW = 16;
const REST = 14;
const LINE_H = 27;
const CHIP_W = 22;
const CHIP_H = 9;
const CHIP_GAP = 7;
const ITEM_GAP = 18;
const HEAD_GAP = 20;
/** 제목 하나의 최대 폭. 넘으면 말줄임한다 */
const TITLE_MAX = 170;

/** 부제와 끝 괄호(판형·리커버 표기 등)를 뗀다 */
export function shortTitle(title: string) {
  return (
    title
      .split(/\s+[-:]\s+/)[0]
      .replace(/\s*[([][^)\]]*[)\]]\s*$/, "")
      .trim() || title.trim()
  );
}

function fit(text: string, maxW: number, size: number, measure: MeasureText) {
  const m = (t: string) => measure(t, size, 700, "hand");
  if (m(text) <= maxW) return text;
  let s = text;
  while (s.length > 1 && m(`${s}…`) > maxW) s = s.slice(0, -1);
  return `${s.trim()}…`;
}

/**
 * 머리말 오른쪽으로 제목을 흘려 놓고, 폭을 넘으면 다음 줄로 내린다.
 * books는 탑 위에서부터의 순서다. 좌표는 목록 왼쪽 위가 원점이다.
 */
export function buildLegend(o: {
  books: LegendBook[];
  heading: string;
  rest?: string;
  width: number;
  colors: SceneColors;
  u: number;
  measure: MeasureText;
}): { items: SceneItem[]; height: number } {
  const { width, colors: C, u, measure } = o;
  const lh = LINE_H * u;
  const out: SceneItem[] = [];
  const text = (t: string, x: number, y: number, size: number, fill: string) =>
    out.push({
      k: "t",
      x,
      y,
      t,
      size,
      weight: 700,
      fam: "hand",
      fill,
      anchor: "start",
    });

  const headW = measure(o.heading, HEAD * u, 700, "hand");
  text(o.heading, 0, lh / 2, HEAD * u, C.ink);
  // 머리말 밑 짧은 연필 밑줄
  const hy = lh / 2 + HEAD * u * 0.72;
  out.push({
    k: "p",
    d: `M${f1(-1 * u)},${f1(hy)} Q${f1(headW * 0.5)},${f1(hy + 2.4 * u)} ${f1(headW + 3 * u)},${f1(hy - 0.8 * u)}`,
    stroke: C.ink,
    sw: 1.2 * u,
    cap: "round",
    op: 0.55,
  });

  const x0 = headW + HEAD_GAP * u;
  let x = x0;
  let line = 0;
  const place = (w: number) => {
    if (x > x0 && x + w > width) {
      x = x0;
      line++;
    }
    const at = { x, y: line * lh + lh / 2 };
    x += w + ITEM_GAP * u;
    return at;
  };

  for (const b of o.books) {
    const title = fit(shortTitle(b.title), TITLE_MAX * u, ROW * u, measure);
    const tw = measure(title, ROW * u, 700, "hand");
    const at = place((CHIP_W + CHIP_GAP) * u + tw);
    // 탑의 책과 같은 그림: 색면을 윤곽에서 살짝 어긋나게 찍고 흔든 윤곽을 두른다
    const rand = rng(hashSeed(`legend:${b.id}`));
    const jj = Array.from({ length: 8 }, rand);
    const cs = rectCorners(
      at.x + (CHIP_W * u) / 2,
      at.y,
      CHIP_W * u,
      CHIP_H * u,
      ((rand() - 0.5) * 6 * Math.PI) / 180,
    );
    out.push(
      {
        k: "p",
        d: poly(cs.map(([px, py]) => [px - 1.4 * u, py - 1.1 * u])),
        fill: b.color,
      },
      {
        k: "p",
        d: sketchPoly(cs, jj, 0.8 * u),
        stroke: C.ink,
        sw: 1.1 * u,
        join: "round",
      },
    );
    text(title, at.x + (CHIP_W + CHIP_GAP) * u, at.y, ROW * u, C.ink);
  }
  if (o.rest) {
    const at = place(measure(o.rest, REST * u, 700, "hand"));
    text(o.rest, at.x, at.y, REST * u, C.muted);
  }
  return { items: out, height: (line + 1) * lh };
}
