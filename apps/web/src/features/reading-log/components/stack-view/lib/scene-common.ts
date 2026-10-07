import { fallbackCoverColor, type ReadingStackBook } from "@bookjeok/core";

import { type Cmds, samplePath, wobble } from "./sketch";
import type { GroupItem, MeasureText, SceneColors, SceneItem } from "./types";

/*
 * 무대(scene.ts)와 라운지 책동산(mountain-scene.ts)이 같이 쓰는 조각.
 * scene.ts는 캐릭터 그림(기본 캐릭터 머리 데이터 포함)을 끌고 오므로, 책동산은 여기서만 가져온다.
 */

/** 책을 칠할 색. 표지색이 없으면(10/30 이후 신간 등) ISBN으로 고른 옅은 색 */
export const bookColor = (b: Pick<ReadingStackBook, "isbn" | "coverColor">) =>
  b.coverColor ?? fallbackCoverColor(b.isbn);

/** 말풍선 몸통의 자리와 꼬리 x(px). 이름표가 부딪히는지 미리 볼 때도 쓴다 */
export function bubbleRect(
  cx: number,
  bottom: number,
  lines: [string, string],
  u: number,
  width: number,
  minX: number,
  measure: MeasureText,
) {
  const w =
    Math.max(...lines.map((t) => measure(t, 16 * u, 700, "hand"))) + 24 * u;
  const x = Math.max(
    minX,
    Math.min(width - w - 3 * u, Math.round(cx - w * 0.62)),
  );
  const h = lines.length * 19 * u + 14 * u;
  const y = Math.max(3 * u, bottom - h - 12 * u);
  const tx = Math.max(x + 16 * u, Math.min(x + w - 16 * u, cx - 6 * u));
  return { x, y, w, h, tx };
}

export function bubbleItem(
  cx: number,
  bottom: number,
  lines: [string, string],
  C: SceneColors,
  u: number,
  width: number,
  minX: number,
  measure: MeasureText,
  boil: boolean,
): GroupItem {
  const size = 16 * u;
  const lh = 19 * u;
  const { x, y, w, h, tx } = bubbleRect(
    cx,
    bottom,
    lines,
    u,
    width,
    minX,
    measure,
  );
  const r = 12 * u;
  const B = y + h;
  // 선만 연필로 긋는다. 캐릭터와 같이 세 벌을 번갈아 보여 떨리게 한다
  const shape: Cmds = [
    "M",
    x + r,
    y,
    "L",
    x + w - r,
    y,
    "Q",
    x + w,
    y,
    x + w,
    y + r,
    "L",
    x + w,
    B - r,
    "Q",
    x + w,
    B,
    x + w - r,
    B,
    "L",
    tx + 7 * u,
    B,
    "L",
    tx + 2 * u,
    B + 11 * u,
    "L",
    tx - 5 * u,
    B,
    "L",
    x + r,
    B,
    "Q",
    x,
    B,
    x,
    B - r,
    "L",
    x,
    y + r,
    "Q",
    x,
    y,
    x + r,
    y,
  ];
  const outline = samplePath(shape, (px, py) => [px, py]);
  const children: SceneItem[] = [
    { k: "p", d: wobble(outline, 41, 0.3 * u, true), fill: C.paper },
  ];
  for (const v of boil ? [0, 1, 2] : [0]) {
    const seed = 41 + v * 53;
    children.push({
      k: "g",
      cls: boil ? `stack-boil stack-boil-${v}` : "stack-bubble-line",
      children: [
        {
          k: "p",
          d: wobble(outline, seed, 0.55 * u, true),
          stroke: C.ink,
          sw: 1.7 * u,
          join: "round",
          op: 0.92,
        },
        {
          k: "p",
          d: wobble(outline, seed + 1, 0.95 * u, true),
          stroke: C.ink,
          sw: 0.8 * u,
          join: "round",
          op: 0.35,
        },
      ],
    });
  }
  lines.forEach((t, i) =>
    children.push({
      k: "t",
      x: x + w / 2,
      y: y + 7 * u + lh * (i + 0.5),
      t,
      size,
      weight: 700,
      fam: "hand",
      fill: i ? C.pen : C.ink,
      anchor: "middle",
    }),
  );
  return { k: "g", id: "bubble", cls: "stack-bubble", children };
}
