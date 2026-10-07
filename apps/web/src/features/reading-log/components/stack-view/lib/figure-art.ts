import { createPencil, type Pencil } from "./pencil";
import { f1 } from "./sketch";
import type { SceneColors, SceneItem } from "./types";

/**
 * 연필 그림 한 점과 발밑 그림자. 세로 0~1000 단위를 (fx, fy)에서 k배로 늘리고 box는 가로 범위.
 * 사물 사다리와 책동산 이정표가 같이 쓴다
 */
export function buildArt(opts: {
  fx: number;
  fy: number;
  k: number;
  colors: SceneColors;
  u: number;
  box: [number, number];
  draw: (p: Pencil) => void;
  boil: boolean;
}): SceneItem[] {
  const { fx, fy, k, colors: C, u, box, draw, boil } = opts;
  const T = (x: number, y: number): [number, number] => [
    fx + x * k,
    fy + y * k,
  ];
  const [x0, x1] = box;
  const out: SceneItem[] = [];

  // 발밑 그림자. 사물이 작아도 몇 가닥은 보이게 간격을 px로 잡는다
  const [left, floor] = T(x0, 1004);
  const [right] = T(x1, 1004);
  const half = (right - left) / 2;
  const mid = left + half;
  const step = Math.max(3.2 * u, Math.min(11 * k, half / 3));
  let hatchShadow = "";
  for (let x = -half * 0.95; x <= half * 0.95; x += step) {
    const e = 1 - (x / (half * 1.05)) ** 2;
    const len = Math.min(10 * k, 5 * u) * e + 2 * u;
    hatchShadow += `M${f1(mid + x)},${f1(floor)} L${f1(mid + x + len * 0.8)},${f1(floor + len)} `;
  }
  out.push({
    k: "p",
    d: hatchShadow,
    stroke: C.ink,
    sw: 1 * u,
    cap: "round",
    op: 0.35,
  });

  const variants = boil ? [0, 1, 2] : [0];
  for (const v of variants) {
    const p = createPencil({ T, C, u, seed: 431 + v * 53 });
    draw(p);
    out.push({
      k: "g",
      id: `object-${v}`,
      cls: boil ? `stack-boil stack-boil-${v}` : "stack-figure",
      children: p.items,
    });
  }
  return out;
}
