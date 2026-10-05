import type { ReadingStackBook } from "@bookjeok/core";

import { STACK_OBJECTS, type StackObjectSpec } from "./objects";
import { type BodyPart, stackStatus } from "./status";

export interface CollectedObject {
  spec: StackObjectSpec;
  /** 쌓은 높이가 이 사물에 처음 닿은 책. 완독일 순서로 쌓아 정한다 */
  book: ReadingStackBook;
}

export interface ObjectCollection {
  collected: CollectedObject[];
  /** 다음 목표. 다 모았으면 null */
  next: StackObjectSpec | null;
  stackMm: number;
}

/**
 * 한 해 사물 도감. books는 완독일 오름차순(바닥부터)이어야 한다.
 * 지난 날짜로 기록을 더하면 사물을 넘긴 책이 바뀔 수 있다. 저장하지 않고 늘 쌓은 순서에서 다시 센다
 */
export function objectCollection(books: ReadingStackBook[]): ObjectCollection {
  const collected: CollectedObject[] = [];
  let mm = 0;
  let i = 0;
  for (const book of books) {
    mm += book.depth;
    while (i < STACK_OBJECTS.length && STACK_OBJECTS[i].heightMm <= mm)
      collected.push({ spec: STACK_OBJECTS[i++], book });
  }
  return { collected, next: STACK_OBJECTS[i] ?? null, stackMm: mm };
}

export type StackMilestone =
  | { kind: "object"; object: StackObjectSpec; collectedCount: number }
  | { kind: "over" }
  | { kind: "part"; part: BodyPart };

/**
 * 한 권을 더해 새로 넘은 것. 사물 → 내 키 → 몸 부위 순으로 하나만 고른다.
 * 두꺼운 책은 사물 둘을 한 번에 넘기도 해 높은 쪽을 말한다. 넘은 게 없으면 null
 */
export function stackMilestone(
  beforeMm: number,
  afterMm: number,
  userMm: number,
): StackMilestone | null {
  const passed = STACK_OBJECTS.filter(
    (o) => o.heightMm > beforeMm && o.heightMm <= afterMm,
  );
  const object = passed.at(-1);
  if (object)
    return {
      kind: "object",
      object,
      collectedCount: STACK_OBJECTS.filter((o) => o.heightMm <= afterMm).length,
    };
  const before = stackStatus(beforeMm, userMm);
  const after = stackStatus(afterMm, userMm);
  if (after.ratio >= 1 && before.ratio < 1) return { kind: "over" };
  if (after.passed && after.passed !== before.passed)
    return { kind: "part", part: after.passed };
  return null;
}
