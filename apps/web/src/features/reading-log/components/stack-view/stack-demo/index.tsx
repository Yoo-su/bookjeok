"use client";

import { useCallback, useMemo } from "react";

import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { useReadingLogViewStore } from "../../../stores/use-reading-log-view-store";
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

/** 내 독서 키재기로 보낸다. 로그인하지 않았으면 마이페이지 가드가 로그인 후 여기로 돌려보낸다 */
export function StackStartLink({ children }: { children: React.ReactNode }) {
  const setViewMode = useReadingLogViewStore((s) => s.setViewMode);
  return (
    <Link
      href={PATHS.READING_LOG}
      onClick={() => setViewMode("stack")}
      className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-700 px-6 text-[15px] font-semibold text-white hover:bg-emerald-800"
    >
      {children}
    </Link>
  );
}
