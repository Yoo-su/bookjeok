"use client";

import type { ReadingStackBook } from "@bookjeok/core";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/shared/utils";

import { useStackCopy } from "../hooks/use-stack-copy";
import { ladderSteps } from "../lib/objects";
import { StackStage, type StackStageObject } from "../stack-stage";

const CYCLE_MS = 2600;
interface StackLadderStageProps {
  books: ReadingStackBook[];
  ariaLabel: string;
  className?: string;
}

/** 소개용 사물 무대. 몇 초마다 쌓은 책을 키워 다음 사물이 바뀌는 모습을 보여 준다 */
export function StackLadderStage({
  books,
  ariaLabel,
  className,
}: StackLadderStageProps) {
  const { objectScene } = useStackCopy();
  const steps = useMemo(() => ladderSteps(books), [books]);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (steps.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % steps.length), CYCLE_MS);
    return () => clearInterval(id);
  }, [steps.length]);

  const shown = useMemo(
    () => books.slice(0, steps[Math.min(i, steps.length - 1)] ?? books.length),
    [books, steps, i],
  );
  const stackMm = shown.reduce((a, b) => a + b.depth, 0);
  const object = useMemo<StackStageObject>(() => {
    const o = objectScene(stackMm, shown.length ? stackMm / shown.length : 20);
    return { spec: o.object, labels: o.labels };
  }, [objectScene, stackMm, shown.length]);

  return (
    <StackStage
      books={shown}
      stackMm={stackMm}
      object={object}
      fitObjectHeight={false}
      replayKey={0}
      className={cn("h-full md:h-full", className)}
      stackClickLabel=""
      ariaLabel={ariaLabel}
    />
  );
}
