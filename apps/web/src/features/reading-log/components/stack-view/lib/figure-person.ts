import { drawAuthor } from "./figure-authors";
import { createPencil } from "./pencil";
import { f1, type Pt } from "./sketch";
import type { SceneColors, SceneItem, StackAuthor } from "./types";

/** 사람 그림 공통 옵션. 300×1000 단위로 그리고 (fx, fy)에서 k배로 늘린다 */
export interface PersonOptions {
  fx: number;
  fy: number;
  k: number;
  colors: SceneColors;
  u: number;
  heldColor: string;
  /** 흔들림이 다른 세 벌을 만들어 화면이 번갈아 보이게 한다. 공유 이미지는 한 벌만 그린다 */
  boil: boolean;
}

export const personTransform =
  ({ fx, fy, k }: PersonOptions) =>
  (x: number, y: number): Pt => [fx + x * k, fy + y * k];

export const boilClass = (boil: boolean, v: number) =>
  boil ? `stack-boil stack-boil-${v}` : "stack-figure";

/** 발밑 그림자 */
export function personShadow(o: PersonOptions): SceneItem {
  const T = personTransform(o);
  let d = "";
  for (let x = -112; x <= 112; x += 11) {
    const e = 1 - (x / 118) ** 2;
    const [a, b] = T(x + 150, 1004);
    d += `M${f1(a)},${f1(b)} L${f1(a + (10 * e + 3) * o.k)},${f1(b + (13 * e + 3) * o.k)} `;
  }
  return {
    k: "p",
    d,
    stroke: o.colors.ink,
    sw: 1 * o.u,
    cap: "round",
    op: 0.35,
  };
}

/**
 * 작가 캐리커처. 홈 인사(`author-peek`)가 기본 캐릭터의 머리 데이터를 번들에 끌고 오지 않게
 * `figure.ts`와 따로 둔다.
 */
export function buildAuthorFigure(
  opts: PersonOptions & {
    author: StackAuthor;
    /**
     * 오른팔을 들고 팔뚝·손을 `peek-forearm` 묶음으로 따로 둔다.
     * heart면 손하트를 하고 위에 뜨는 하트를 `peek-heart` 묶음으로 둔다
     */
    arm?: "wave" | "heart";
    /** 머리를 `peek-head` 묶음으로 따로 둬 고개만 움직일 수 있게 한다 */
    peek?: boolean;
  },
): SceneItem[] {
  const { colors: C, u, author, heldColor, boil, arm: raised } = opts;
  const T = personTransform(opts);
  const out: SceneItem[] = [personShadow(opts)];
  const variants = boil ? [0, 1, 2] : [0];
  for (const v of variants) {
    const p = createPencil({ T, C, u, seed: 211 + v * 53, split: opts.peek });
    const arm = raised
      ? createPencil({ T, C, u, seed: 911 + v * 53 })
      : undefined;
    const heart =
      raised === "heart"
        ? createPencil({ T, C, u, seed: 977 + v * 53 })
        : undefined;
    drawAuthor(p, {
      author,
      heldColor,
      raise: arm && {
        arm,
        hand: raised === "heart" ? "heart" : "open",
        heart,
      },
    });
    out.push({
      k: "g",
      id: `figure-${v}`,
      cls: boilClass(boil, v),
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
