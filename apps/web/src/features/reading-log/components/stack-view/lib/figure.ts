import { drawAuthor } from "./figure-authors";
import { drawObject } from "./figure-objects";
import { drawReader } from "./figure-reader";
import { OBJECT_ART } from "./objects";
import { createPencil } from "./pencil";
import { f1 } from "./sketch";
import type {
  Mood,
  SceneColors,
  SceneItem,
  StackCharacter,
  StackObject,
} from "./types";

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
  character: StackCharacter;
  heldColor: string;
  boil: boolean;
  /**
   * 작가만. 오른팔을 들고 팔뚝·손을 `peek-forearm` 묶음으로 따로 둔다.
   * heart면 손하트를 하고 위에 뜨는 하트를 `peek-heart` 묶음으로 둔다
   */
  arm?: "wave" | "heart";
  /** 작가만. 머리를 `peek-head` 묶음으로 따로 둬 고개만 움직일 수 있게 한다 */
  peek?: boolean;
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
    const p = createPencil({ T, C, u, seed: 211 + v * 53, split: opts.peek });
    const author = character !== "M" && character !== "F";
    const arm =
      opts.arm && author
        ? createPencil({ T, C, u, seed: 911 + v * 53 })
        : undefined;
    const heart =
      opts.arm === "heart" && author
        ? createPencil({ T, C, u, seed: 977 + v * 53 })
        : undefined;
    if (character === "M" || character === "F")
      drawReader(p, { character, mood, heldColor });
    else
      drawAuthor(p, {
        author: character,
        heldColor,
        raise: arm && {
          arm,
          hand: opts.arm === "heart" ? "heart" : "open",
          heart,
        },
      });
    out.push({
      k: "g",
      id: `figure-${v}`,
      cls: boil ? `stack-boil stack-boil-${v}` : "stack-figure",
      children: [
        ...p.items,
        ...(p.head.length
          ? [{ k: "g" as const, cls: "peek-head", children: p.head }]
          : []),
        ...(arm
          ? [{ k: "g" as const, cls: "peek-forearm", children: arm.items }]
          : []),
        ...(heart
          ? [{ k: "g" as const, cls: "peek-heart", children: heart.items }]
          : []),
      ],
    });
  }
  return out;
}

/**
 * 사물 사다리의 사물. 캐릭터와 같은 연필로 그린다. 세로 0~1000 단위를 (fx, fy)에서 k배로 늘리고,
 * 가로는 `OBJECT_ART`의 범위를 쓴다. boil이면 캐릭터처럼 세 벌을 번갈아 보인다.
 */
export function buildObject(opts: {
  fx: number;
  fy: number;
  k: number;
  colors: SceneColors;
  u: number;
  object: StackObject;
  heldColor: string;
  boil: boolean;
}): SceneItem[] {
  const { fx, fy, k, colors: C, u, object, heldColor, boil } = opts;
  const T = (x: number, y: number): [number, number] => [
    fx + x * k,
    fy + y * k,
  ];
  const [x0, x1] = OBJECT_ART[object].x;
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
    drawObject(p, { object, heldColor });
    out.push({
      k: "g",
      id: `object-${v}`,
      cls: boil ? `stack-boil stack-boil-${v}` : "stack-figure",
      children: p.items,
    });
  }
  return out;
}
