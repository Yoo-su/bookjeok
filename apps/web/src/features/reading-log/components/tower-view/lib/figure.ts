import { drawAuthor } from "./figure-authors";
import { drawReader } from "./figure-reader";
import { createPencil } from "./pencil";
import { f1 } from "./sketch";
import type { Mood, SceneColors, SceneItem, TowerCharacter } from "./types";

/**
 * 연필로 대충 그린 사람. 300×1000 단위로 그리고 (fx, fy)에서 k배로 늘린다.
 *
 * boil이면 흔들림이 다른 세 벌을 만든다. 화면이 번갈아 보여 선이 살짝 떨리게 한다.
 * 공유 이미지는 한 벌만 그린다.
 */
export function buildFigure(opts: {
  fx: number;
  fy: number;
  k: number;
  colors: SceneColors;
  u: number;
  mood: Mood;
  character: TowerCharacter;
  heldColor: string;
  boil: boolean;
}): SceneItem[] {
  const { fx, fy, k, colors: C, u, mood, character, heldColor, boil } = opts;
  const T = (x: number, y: number): [number, number] => [
    fx + x * k,
    fy + y * k,
  ];
  const out: SceneItem[] = [];

  // 발밑 그림자
  let hatchShadow = "";
  for (let x = -112; x <= 112; x += 11) {
    const e = 1 - (x / 118) ** 2;
    const [a, b] = T(x + 150, 1004);
    hatchShadow += `M${f1(a)},${f1(b)} L${f1(a + (10 * e + 3) * k)},${f1(b + (13 * e + 3) * k)} `;
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
    const p = createPencil({ T, C, u, seed: 211 + v * 53 });
    if (character === "M" || character === "F")
      drawReader(p, { character, mood, heldColor });
    else drawAuthor(p, { author: character, heldColor });
    out.push({
      k: "g",
      id: `figure-${v}`,
      cls: boil ? `tower-boil tower-boil-${v}` : "tower-figure",
      children: p.items,
    });
  }
  return out;
}
