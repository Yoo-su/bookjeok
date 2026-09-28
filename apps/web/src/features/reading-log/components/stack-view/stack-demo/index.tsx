"use client";

import { useCallback, useMemo } from "react";

import { ReadingLogStartLink } from "../../common/reading-log-start-link";
import { cm1, useStackCopy } from "../hooks/use-stack-copy";
import { useStackPerson } from "../hooks/use-stack-person";
import { SAMPLE_BOOKS } from "../lib/sample-books";
import {
  type CompareLabelsFor,
  StackCompareStage,
} from "../stack-compare-stage";
import type { StackStagePerson } from "../stack-stage";

const STACK_MM = SAMPLE_BOOKS.reduce((a, b) => a + b.depth, 0);
const AVG_DEPTH_MM = STACK_MM / SAMPLE_BOOKS.length;

/** 소개 페이지의 체험 무대. 예시 46권 옆에 나 또는 작가를 바꿔 세운다 */
export function StackDemo() {
  const { t, sceneLabels } = useStackCopy();
  const { character, heightCm } = useStackPerson();

  const labelsFor = useCallback<CompareLabelsFor>(
    (status, userMm, authorName) =>
      sceneLabels({
        status,
        stackMm: STACK_MM,
        userMm,
        avgDepthMm: AVG_DEPTH_MM,
        authorName,
      }),
    [sceneLabels],
  );
  const me = useMemo<StackStagePerson>(
    () => ({
      userMm: heightCm * 10,
      character,
      labelsFor: (s, mm) => labelsFor(s, mm, null),
    }),
    [heightCm, character, labelsFor],
  );

  return (
    <div className="relative h-[400px] overflow-hidden rounded-2xl border border-stone-200 bg-white bg-[radial-gradient(#e2e0dd_1.1px,transparent_1.4px)] bg-[length:16px_16px] bg-[position:6px_6px] px-3 pt-2 sm:h-[460px]">
      <StackCompareStage
        books={SAMPLE_BOOKS}
        stackMm={STACK_MM}
        labelsFor={labelsFor}
        me={me}
        ariaLabel={t("stage_label", {
          count: SAMPLE_BOOKS.length,
          height: cm1(STACK_MM),
          me: heightCm,
        })}
      />
    </div>
  );
}

/** 내 독서 키재기로 보낸다 */
export function StackStartLink({ children }: { children: React.ReactNode }) {
  return <ReadingLogStartLink view="stack">{children}</ReadingLogStartLink>;
}
