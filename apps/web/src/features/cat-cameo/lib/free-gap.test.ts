import { describe, expect, it } from "vitest";

import { pickStopCenter } from "./free-gap";

describe("pickStopCenter", () => {
  // 320px 폰 상단바: 메뉴 · 로고 · (빈 틈) · 검색 · 로그인
  const phone = {
    width: 296,
    taken: [
      [24, 48],
      [62, 132],
      [196, 220],
      [232, 280],
    ] as [number, number][],
    margin: 31,
  };

  it("몸이 들어가는 빈 틈 안에 선다", () => {
    for (const r of [0, 0.3, 0.7, 0.99]) {
      const c = pickStopCenter({ ...phone, need: 41, rand: () => r });
      expect(c).not.toBeNull();
      expect(c! - 41 / 2).toBeGreaterThanOrEqual(132);
      expect(c! + 41 / 2).toBeLessThanOrEqual(196);
    }
  });

  it("들어갈 틈이 없으면 null", () => {
    expect(pickStopCenter({ ...phone, need: 80, rand: () => 0.5 })).toBeNull();
  });

  it("양 끝 둥근 모서리(margin)에는 서지 않는다", () => {
    const c = pickStopCenter({
      width: 400,
      taken: [[80, 360]],
      need: 30,
      margin: 40,
      rand: () => 0,
    });
    expect(c).toBe(40 + 15);
  });

  it("넓은 틈을 더 자주 고른다", () => {
    let wide = 0;
    for (let i = 0; i < 200; i++) {
      const v = i / 200;
      const c = pickStopCenter({
        width: 1000,
        taken: [
          [100, 160],
          [700, 900],
        ],
        need: 40,
        margin: 30,
        rand: () => v,
      })!;
      if (c > 160 && c < 700) wide++;
    }
    expect(wide).toBeGreaterThan(150);
  });
});
