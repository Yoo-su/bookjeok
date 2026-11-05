import { describe, expect, it } from "vitest";

import type { SceneItem } from "@/features/reading-log/components/stack-view/lib/types";

import { drawPeekingCat, drawWalkingCat } from "./draw";

function points(items: SceneItem[]): number[][] {
  const out: number[][] = [];
  for (const it of items) {
    if (it.k === "g") out.push(...points(it.children));
    else if (it.k === "p")
      for (const m of it.d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g))
        out.push([Number(m[1]), Number(m[2])]);
  }
  return out;
}

describe("걷는 고양이", () => {
  it.each([0.3, 0.42, 0.5])(
    "k=%s에서 그림이 틀 안에 있고 발이 땅에 닿는다",
    (k) => {
      const cat = drawWalkingCat(k);
      const legs = [...cat.farLegs, ...cat.nearLegs];
      const all = points([
        ...cat.tail.items,
        ...legs.flatMap((l) => l.items),
        ...cat.body,
        ...cat.profile,
        ...cat.front.face,
        ...cat.front.eyes,
      ]);
      // 손떨림과 선 굵기 반만큼 여유
      const pad = 3 * k + 1;
      for (const [x, y] of all) {
        expect(x).toBeGreaterThanOrEqual(-pad);
        expect(x).toBeLessThanOrEqual(cat.width + pad);
        expect(y).toBeGreaterThanOrEqual(-pad);
        expect(y).toBeLessThanOrEqual(cat.height + pad);
      }
      for (const leg of legs) {
        const low = Math.max(...points(leg.items).map((p) => p[1]));
        expect(Math.abs(low - cat.groundY)).toBeLessThan(2 * k + 1);
      }
    },
  );

  it("정면 얼굴이 옆얼굴 자리에 앉는다", () => {
    const cat = drawWalkingCat(0.42);
    const cx = (items: SceneItem[]) => {
      const xs = points(items).map((p) => p[0]);
      return (Math.min(...xs) + Math.max(...xs)) / 2;
    };
    expect(Math.abs(cx(cat.front.eyes) - cx(cat.profile))).toBeLessThan(6);
  });
});

describe("빼꼼 고양이", () => {
  it("귀 끝이 틀 안에 있고 앞발이 아래 모서리에 걸친다", () => {
    const cat = drawPeekingCat(24);
    const face = points(cat.front.face);
    expect(Math.min(...face.map((p) => p[1]))).toBeGreaterThanOrEqual(0);
    const paws = points(cat.paws);
    const pawBottom = Math.max(...paws.map((p) => p[1]));
    expect(pawBottom).toBeGreaterThan(cat.height - 1);
    const xs = paws.map((p) => p[0]);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThanOrEqual(cat.width);
  });
});
