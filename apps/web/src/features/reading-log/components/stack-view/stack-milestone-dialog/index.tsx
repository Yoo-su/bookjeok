"use client";

import type { ReadingStackBook } from "@bookjeok/core";
import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";
import { cn } from "@/shared/utils";

import { HandUnderline } from "../hand-underline";
import { cm1, useStackCopy } from "../hooks/use-stack-copy";
import { objectCollection, type StackMilestone } from "../lib/collection";
import { STACK_OBJECTS } from "../lib/objects";
import type { SceneLabels } from "../lib/scene";
import type { StackReaderCharacter } from "../lib/types";
import {
  STACK_ENTER_LAND_MS,
  StackStage,
  type StackStageObject,
  type StackStagePerson,
} from "../stack-stage";

/** 높이 숫자가 올라가는 시간(ms) */
const COUNT_MS = 520;

/** 무대 높이 범위(px). 화면이 낮으면 버튼이 접히지 않게 줄인다 */
const STAGE = { min: 160, max: 300 };
/** 대화상자 최대 높이(화면 대비). 클래스의 max-h-[94dvh]와 같아야 한다 */
const DIALOG_MAX_VH = 0.94;
/** 가로 배치에서 무대 칸의 위아래 여백(px) */
const WIDE_CHROME = 40;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/**
 * 창 크기. 이 대화상자는 브라우저에서만 그리므로 첫 렌더부터 실제 값을 읽는다.
 * 첫 렌더 뒤에 배치가 바뀌면 들이던 책의 움직임이 끊긴다
 */
function useViewportSize() {
  const read = () =>
    typeof window === "undefined"
      ? { w: 1024, h: 800 }
      : { w: window.innerWidth, h: window.innerHeight };
  const [size, setSize] = useState(read);
  useEffect(() => {
    const onResize = () => setSize(read());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

export interface StackMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 방금 기록한 책을 포함한 그해 쌓은 책(완독일 오름차순) */
  books: ReadingStackBook[];
  logId: string;
  milestone: StackMilestone;
  userMm: number;
  character: StackReaderCharacter;
  onOpenCollection?: () => void;
  onViewStack?: () => void;
}

/**
 * 기록한 책으로 사물·몸 부위·내 키를 넘었을 때 띄우는 장면. 그 책 한 권만 무대에 들이고,
 * 닿는 순간 높이 숫자를 올린다. 넘은 게 없는 기록은 토스트로 알린다
 */
export function StackMilestoneDialog({
  open,
  onOpenChange,
  books,
  logId,
  milestone,
  userMm,
  character,
  onOpenCollection,
  onViewStack,
}: StackMilestoneDialogProps) {
  const t = useTranslations("reading_log.stack.milestone");
  const tStack = useTranslations("reading_log.stack");
  const { objectName, len, sceneLabels } = useStackCopy();
  const reducedMotion = usePrefersReducedMotion();
  const viewport = useViewportSize();
  // 가로로 눕힌 폰처럼 낮고 넓으면 무대를 왼쪽, 글과 버튼을 오른쪽에 둔다
  const wide = viewport.h <= 520 && viewport.w >= 600;
  // 낮은 화면에서도 무대와 버튼이 한눈에 들어오게 무대를 줄인다. 세로 배치는 제목·문장이
  // 폭에 따라 몇 줄로 접힐지 몰라 무대를 그리기 전에 나머지 높이를 재서 정한다
  // 대화상자 내용은 포털로 한 박자 늦게 붙으므로 붙는 순간 다시 재게 상태로 받는다
  const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const [chrome, setChrome] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = contentEl;
    if (!open || wide || !el) return;
    const stage = stageWrapRef.current?.firstElementChild as HTMLElement | null;
    setChrome(el.scrollHeight - (stage?.offsetHeight ?? 0));
  }, [contentEl, open, wide, viewport.w, viewport.h]);
  // 반올림으로 1px 넘쳐 스크롤이 생기지 않게 2px 여유를 둔다
  const room =
    viewport.h * DIALOG_MAX_VH - (wide ? WIDE_CHROME : (chrome ?? 0)) - 2;
  const stageH =
    wide || chrome !== null
      ? Math.floor(clamp(room, STAGE.min, STAGE.max))
      : null;

  const book = books.find((b) => b.logId === logId);
  const stackMm = books.reduce((a, b) => a + b.depth, 0);
  const beforeMm = stackMm - (book?.depth ?? 0);
  const avgDepthMm = books.length ? stackMm / books.length : 20;
  const { next } = objectCollection(books);

  const object = useMemo<StackStageObject | undefined>(() => {
    if (milestone.kind !== "object") return undefined;
    const spec = milestone.object;
    const labels: SceneLabels = {
      myHeight: tStack("object_height", {
        name: objectName(spec.id, "name"),
        len: len(spec.heightMm),
      }),
      myHeightShort: tStack("object_height_short", { len: len(spec.heightMm) }),
      remain: "",
      approxBooks: "",
      stackHeight: `${cm1(stackMm)}cm`,
      bubble: [
        t("bubble_object"),
        t("bubble_object_cm", { cm: cm1(stackMm - spec.heightMm) }),
      ],
    };
    return { spec, labels };
  }, [milestone, stackMm, t, tStack, objectName, len]);

  const person = useMemo<StackStagePerson>(
    () => ({
      userMm,
      character,
      // 넘은 순간은 내 키로 말한다. 비교 작가를 골라 뒀어도 쓰지 않는다
      labelsFor: (status, mm) =>
        sceneLabels({
          status,
          stackMm,
          userMm: mm,
          avgDepthMm,
          authorName: null,
        }),
    }),
    [userMm, character, sceneLabels, stackMm, avgDepthMm],
  );

  // 책이 닿는 순간 이전 높이에서 지금 높이로 올린다
  const [shownMm, setShownMm] = useState(stackMm);
  useEffect(() => {
    if (!open || reducedMotion) {
      setShownMm(stackMm);
      return;
    }
    setShownMm(beforeMm);
    let raf = 0;
    const t0 = performance.now() + STACK_ENTER_LAND_MS;
    const tick = (now: number) => {
      const p = Math.max(0, Math.min(1, (now - t0) / COUNT_MS));
      setShownMm(beforeMm + (stackMm - beforeMm) * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, reducedMotion, beforeMm, stackMm]);

  const title =
    milestone.kind === "object"
      ? t("title_object", { name: objectName(milestone.object.id, "object") })
      : milestone.kind === "over"
        ? t("title_over")
        : t("title_part", {
            part: tStack(`parts.${milestone.part}.object`),
          });

  const kicker =
    milestone.kind === "object"
      ? t("eyebrow_object", {
          count: milestone.collectedCount,
          total: STACK_OBJECTS.length,
        })
      : t("eyebrow_body");

  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={setContentEl}
        className={cn(
          "max-h-[94dvh] gap-0 overflow-y-auto p-0",
          wide
            ? "max-w-[680px] grid-cols-2 items-center sm:max-w-[680px]"
            : "sm:max-w-[420px]",
        )}
      >
        <div
          className={cn(
            "overflow-hidden rounded-2xl border border-stone-200 bg-white bg-[radial-gradient(#e2e0dd_1.1px,transparent_1.4px)] bg-[length:16px_16px] bg-[position:6px_6px] px-2 pt-1.5",
            wide ? "row-span-3 m-4 mr-0" : "order-2 mx-4 mt-4",
          )}
          ref={stageWrapRef}
        >
          {open && stageH !== null && (
            <StackStage
              books={books}
              stackMm={stackMm}
              person={object ? undefined : person}
              object={object}
              objectMaxHeight={stageH}
              height={stageH}
              replayKey={0}
              enteringLogId={logId}
              celebrate
              stackClickLabel=""
              ariaLabel={t("stage_label", { cm: cm1(stackMm) })}
            />
          )}
        </div>

        <header className={cn("grid gap-2 px-6 pt-6", !wide && "order-1")}>
          <p className="flex items-center gap-2.5 text-[10.5px] font-bold uppercase tracking-[0.3em] text-emerald-700 before:h-px before:w-6 before:bg-current">
            {kicker}
          </p>
          <DialogTitle className="pr-8 font-serif text-[26px] font-semibold leading-tight tracking-tight text-stone-900">
            {title}
          </DialogTitle>
        </header>

        <div className={cn("grid gap-1.5 px-6 pt-5", !wide && "order-3")}>
          <DialogDescription className="text-[15px] leading-relaxed text-stone-700">
            {t.rich("body", {
              title: book.title,
              cm: cm1(shownMm),
              h: (chunks) => (
                <b className="relative inline-block font-serif text-[1.15em] font-semibold tabular-nums text-stone-900">
                  {chunks}
                  <HandUnderline />
                </b>
              ),
            })}
          </DialogDescription>
          {/* 사람 무대는 말풍선이 다음 부위를 말하므로 사물 이야기를 섞지 않는다 */}
          {object && (
            <p className="text-[13px] text-stone-500">
              {next
                ? t("next_object", {
                    name: objectName(next.id, "name"),
                    cm: cm1(next.heightMm - stackMm),
                  })
                : t("all_collected")}
            </p>
          )}
        </div>

        <footer
          className={cn("flex gap-2 px-6 pb-6", wide ? "pt-5" : "order-4 pt-6")}
        >
          {onOpenCollection && (
            <button
              type="button"
              onClick={onOpenCollection}
              className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50"
            >
              {t("view_collection")}
            </button>
          )}
          <button
            type="button"
            onClick={onViewStack ?? (() => onOpenChange(false))}
            className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-full bg-stone-900 px-4 py-3 text-sm font-bold text-white hover:bg-stone-800"
          >
            {onViewStack ? t("view_stack") : t("close")}
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
