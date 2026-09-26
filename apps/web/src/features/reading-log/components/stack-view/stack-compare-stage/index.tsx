"use client";

import type { ReadingStackBook } from "@bookjeok/core";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/shared/utils";

import { STACK_AUTHORS } from "../lib/authors";
import type { StackStatus } from "../lib/status";
import type { StackAuthor } from "../lib/types";
import { StackStage, type StackStagePerson } from "../stack-stage";

/** 작가가 도는 순서 */
const AUTHOR_ORDER: StackAuthor[] = [
  "kafka",
  "sartre",
  "woolf",
  "camus",
  "kundera",
];
const CYCLE_MS = 2600;

export type CompareLabelsFor = (
  status: StackStatus,
  userMm: number,
  authorName: string | null,
) => ReturnType<StackStagePerson["labelsFor"]>;

interface StackCompareStageProps {
  books: ReadingStackBook[];
  stackMm: number;
  labelsFor: CompareLabelsFor;
  ariaLabel: string;
  /** 있으면 칩 맨 앞에 「내 키」를 두고 여기서 시작한다 */
  me?: StackStagePerson;
  /** 누르기 전까지 몇 초마다 다음 사람으로 넘긴다 */
  autoCycle?: boolean;
  className?: string;
}

/** 같은 쌓은 책 옆에 나 또는 작가를 바꿔 세운다. 이름 칩을 누르면 그 사람에서 멈춘다 */
export function StackCompareStage({
  books,
  stackMm,
  labelsFor,
  ariaLabel,
  me,
  autoCycle = true,
  className,
}: StackCompareStageProps) {
  const t = useTranslations("reading_log.stack");
  const ids: ("me" | StackAuthor)[] = me
    ? ["me", ...AUTHOR_ORDER]
    : AUTHOR_ORDER;
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(autoCycle);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setI((v) => (v + 1) % ids.length), CYCLE_MS);
    return () => clearInterval(id);
  }, [auto, ids.length]);

  const who = ids[i];
  const name = who === "me" ? null : t(`authors.${who}`);
  const person = useMemo<StackStagePerson>(
    () =>
      who === "me" && me
        ? me
        : {
            userMm: STACK_AUTHORS[who as StackAuthor].heightCm * 10,
            character: who as StackAuthor,
            labelsFor: (s, mm) => labelsFor(s, mm, name),
          },
    [who, me, name, labelsFor],
  );

  return (
    <>
      <div className="absolute left-3 top-2.5 z-[1] flex max-w-[calc(100%-56px)] flex-wrap gap-1">
        {ids.map((id, k) => (
          <button
            key={id}
            type="button"
            aria-pressed={k === i}
            onClick={() => {
              setAuto(false);
              setI(k);
            }}
            className={cn(
              "cursor-pointer rounded-full border px-2 py-0.5 text-[11.5px] font-semibold",
              k === i
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-stone-200 bg-white text-stone-500",
            )}
          >
            {id === "me" ? t("compare_me") : t(`author_short.${id}`)}
          </button>
        ))}
      </div>
      <StackStage
        books={books}
        stackMm={stackMm}
        person={person}
        replayKey={0}
        className={cn("h-full md:h-full", className)}
        stackClickLabel=""
        ariaLabel={ariaLabel}
      />
    </>
  );
}
