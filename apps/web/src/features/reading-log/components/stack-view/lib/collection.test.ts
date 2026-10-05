import type { ReadingStackBook } from "@bookjeok/core";
import { describe, expect, it } from "vitest";

import { objectCollection, stackMilestone } from "./collection";
import { SAMPLE_BOOKS } from "./sample-books";

const book = (depth: number, n: number): ReadingStackBook => ({
  ...SAMPLE_BOOKS[0],
  logId: `log-${n}`,
  isbn: `isbn-${n}`,
  depth,
});

describe("objectCollection", () => {
  it("빈 해는 모은 사물 없이 각설탕이 다음 목표다", () => {
    const c = objectCollection([]);
    expect(c.collected).toEqual([]);
    expect(c.next?.id).toBe("sugar");
    expect(c.stackMm).toBe(0);
  });

  it("쌓은 높이가 사물에 처음 닿은 책을 기록한다", () => {
    // 10 → 30(각설탕 16) → 55(지우개 50) → 80(달걀 75)
    const books = [book(10, 1), book(20, 2), book(25, 3), book(25, 4)];
    const c = objectCollection(books);
    expect(c.collected.map((x) => [x.spec.id, x.book.logId])).toEqual([
      ["sugar", "log-2"],
      ["eraser", "log-3"],
      ["egg", "log-4"],
    ]);
    expect(c.next?.id).toBe("hamster");
  });

  it("한 권이 사물 여럿을 넘으면 모두 그 책으로 모은다", () => {
    const c = objectCollection([book(80, 1)]);
    expect(c.collected.map((x) => x.spec.id)).toEqual([
      "sugar",
      "eraser",
      "egg",
    ]);
    expect(new Set(c.collected.map((x) => x.book.logId))).toEqual(
      new Set(["log-1"]),
    );
  });

  it("높이가 꼭 같으면 넘은 것으로 친다", () => {
    expect(objectCollection([book(16, 1)]).collected[0]?.spec.id).toBe("sugar");
  });

  it("다 모으면 다음 목표가 없다", () => {
    const c = objectCollection([book(5000, 1)]);
    expect(c.collected).toHaveLength(13);
    expect(c.next).toBeNull();
  });
});

describe("stackMilestone", () => {
  const userMm = 1700;

  it("넘은 게 없으면 null", () => {
    expect(stackMilestone(20, 40, userMm)).toBeNull();
  });

  it("사물 둘을 한 번에 넘으면 높은 쪽과 모은 개수를 말한다", () => {
    expect(stackMilestone(40, 80, userMm)).toEqual({
      kind: "object",
      object: expect.objectContaining({ id: "egg" }),
      collectedCount: 3,
    });
  });

  it("사물이 없으면 키를 넘은 것을 몸 부위보다 먼저 말한다", () => {
    expect(stackMilestone(1690, 1710, 1700)).toEqual({ kind: "over" });
  });

  it("몸 부위를 새로 넘으면 그 부위를 말한다", () => {
    // 무릎 0.28 × 1700 = 476
    expect(stackMilestone(470, 478, userMm)).toEqual({
      kind: "part",
      part: "knee",
    });
  });
});
