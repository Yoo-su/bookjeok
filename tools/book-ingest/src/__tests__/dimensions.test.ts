import { describe, expect, it } from "vitest";

import { formatDimensions, hasMeasurement, toDimensions } from "../dimensions";

describe("toDimensions", () => {
  it("값을 정수로 반올림해 싣는다", () => {
    expect(
      toDimensions("aladin", {
        width: 152,
        height: 223.4,
        depth: 17,
        pages: 297,
        weight: 440,
        binding: "반양장본",
      }),
    ).toEqual({
      source: "aladin",
      width: 152,
      height: 223,
      depth: 17,
      pages: 297,
      weight: 440,
      binding: "반양장본",
    });
  });

  it("가로·세로가 뒤바뀐 원본은 큰 값을 height로 — 문학과지성 시인선 205×128", () => {
    expect(toDimensions("aladin", { width: 205, height: 128 })).toMatchObject({
      width: 128,
      height: 205,
    });
  });

  it("0·음수·숫자 아님은 결측", () => {
    expect(
      toDimensions("aladin", { width: 0, height: -1, depth: "x", pages: 120 }),
    ).toMatchObject({ width: null, height: null, depth: null, pages: 120 });
  });

  it("믿을 범위 밖은 NULL — smallint 초과로 INSERT가 깨지지 않게(9788954415415)", () => {
    expect(
      toDimensions("aladin", { width: 150, pages: 18480, weight: 35112 }),
    ).toMatchObject({ width: 150, pages: null, weight: null });
  });

  it("제본명 '미확인'과 20자 초과는 버린다", () => {
    expect(
      toDimensions("aladin", { pages: 100, binding: "미확인" })?.binding,
    ).toBeNull();
    expect(
      toDimensions("aladin", { pages: 100, binding: "가".repeat(21) })?.binding,
    ).toBeNull();
  });

  it("남는 값이 없으면 null", () => {
    expect(toDimensions("aladin", {})).toBeNull();
    expect(toDimensions("aladin", { width: 0, binding: "미확인" })).toBeNull();
  });

  it("제본명만 있으면 남기되 실측으로 치지 않는다", () => {
    const d = toDimensions("aladin", { binding: "양장본" });
    expect(d?.binding).toBe("양장본");
    expect(hasMeasurement(d)).toBe(false);
  });
});

describe("formatDimensions", () => {
  it("있는 값만 잇는다", () => {
    expect(
      formatDimensions({
        source: "aladin",
        width: 152,
        height: 223,
        depth: 17,
        pages: 297,
        weight: 440,
        binding: "반양장본",
      }),
    ).toBe("152×223×17mm · 297쪽 · 440g · 반양장본");
    expect(
      formatDimensions({
        source: "aladin",
        width: null,
        height: null,
        depth: 12,
        pages: null,
        weight: null,
        binding: null,
      }),
    ).toBe("두께 12mm");
  });
});
