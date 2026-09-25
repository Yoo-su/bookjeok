import { describe, expect, it } from "vitest";

import { BOOK_COVER_MM, BOOK_MM_PER_PAGE, DEFAULT_BOOK_SIZE, estimateBookSize, fallbackCoverColor, inkColorFor } from "../utils";

describe("estimateBookSize", () => {
  it("세 치수가 모두 있으면 실측으로 둔다", () => {
    const r = estimateBookSize("9788936434120", { width: 145, height: 210, depth: 13, weight: 300, pages: 216 });
    expect(r).toEqual({ width: 145, height: 210, depth: 13, weight: 300, pages: 216, sizeSource: "measured" });
  });

  it("두께가 없으면 쪽수로 추정한다", () => {
    const r = estimateBookSize("9788936434120", { width: 145, height: 210, pages: 300 });
    expect(r.depth).toBe(Math.round(300 * BOOK_MM_PER_PAGE + BOOK_COVER_MM.soft));
    expect(r.sizeSource).toBe("estimated");
  });

  it("양장본은 표지만큼 더 두껍다", () => {
    const soft = estimateBookSize("9788936434120", { pages: 300 });
    const hard = estimateBookSize("9788936434120", { pages: 300, binding: "양장본" });
    expect(hard.depth).toBeGreaterThan(soft.depth);
  });

  it("아무 값이 없어도 기본 판형 근처로 채운다", () => {
    const r = estimateBookSize("9791100000000", {});
    expect(Math.abs(r.height - DEFAULT_BOOK_SIZE.height)).toBeLessThanOrEqual(8);
    expect(Math.abs(r.depth - DEFAULT_BOOK_SIZE.depth)).toBeLessThanOrEqual(4);
    expect(r.weight).toBeGreaterThan(0);
    expect(r.sizeSource).toBe("estimated");
  });

  it("같은 ISBN은 항상 같은 값을, 다른 ISBN은 다른 값을 낸다", () => {
    expect(estimateBookSize("9791100000001", {})).toEqual(estimateBookSize("9791100000001", {}));
    const sizes = new Set(
      ["9791100000001", "9791100000002", "9791100000003", "9791100000004"].map((i) => {
        const r = estimateBookSize(i, {});
        return `${r.height}x${r.depth}`;
      }),
    );
    expect(sizes.size).toBeGreaterThan(1);
  });
});

describe("estimateBookSize 이상치", () => {
  it("말이 안 되는 실측값은 결측으로 보고 추정한다", () => {
    const r = estimateBookSize("9788936434120", { width: 145, height: 210, depth: 0, pages: 216 });
    expect(r.depth).toBe(Math.round(216 * BOOK_MM_PER_PAGE + BOOK_COVER_MM.soft));
    expect(r.sizeSource).toBe("estimated");
    const huge = estimateBookSize("9788936434120", { width: 145, height: 9999, depth: 13 });
    expect(huge.height).toBeLessThan(300);
  });

  it("말이 안 되는 쪽수는 null로 돌려준다", () => {
    // 수확본 실례: 9788954415415 (18480쪽, 35112g)
    const r = estimateBookSize("9788954415415", { width: 164, height: 225, depth: 8, pages: 18480, weight: 35112 });
    expect(r.pages).toBeNull();
    expect(r.weight).toBeLessThan(10000);
    expect(estimateBookSize("9788936434120", { pages: 1 }).pages).toBeNull();
  });
});

describe("fallbackCoverColor", () => {
  it("같은 ISBN은 같은 색, 여러 ISBN은 여러 색", () => {
    expect(fallbackCoverColor("9791100000001")).toBe(fallbackCoverColor("9791100000001"));
    const colors = new Set(Array.from({ length: 20 }, (_, i) => fallbackCoverColor(`97911000000${String(i).padStart(2, "0")}`)));
    expect(colors.size).toBeGreaterThan(3);
  });
});

describe("inkColorFor", () => {
  it("밝은 바탕에는 먹색, 어두운 바탕에는 흰색", () => {
    expect(inkColorFor("#F8F8F8")).toBe("#1C1917");
    expect(inkColorFor("#0A0B0E")).toBe("#F6F2EA");
  });

  it("형식이 틀리면 먹색", () => {
    expect(inkColorFor("red")).toBe("#1C1917");
  });
});
