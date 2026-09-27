"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/shared/utils";

import { cm1, useStackCopy } from "../hooks/use-stack-copy";
import { objectLadder, STACK_OBJECTS } from "../lib/objects";
import { StackStats } from "../stack-progress";

interface StackObjectProgressProps {
  stackMm: number;
  avgDepthMm: number;
  count: number;
  pages: number;
  grams: number;
  className?: string;
}

/** 다음 사물까지 얼마나 남았는지와 올해 넘은 사물 */
export function StackObjectProgress({
  stackMm,
  avgDepthMm,
  count,
  pages,
  grams,
  className,
}: StackObjectProgressProps) {
  const t = useTranslations("reading_log.stack");
  const { objectName, len } = useStackCopy();
  const { passed, next } = objectLadder(stackMm);
  const passedCount = STACK_OBJECTS.filter((o) => o.heightMm <= stackMm).length;
  const top = STACK_OBJECTS[STACK_OBJECTS.length - 1];
  const from = passed?.heightMm ?? 0;
  // 넘은 사물부터 다음 사물까지를 한 칸으로 본다
  const ratio = next ? (stackMm - from) / (next.heightMm - from) : 1;
  const remain = next ? next.heightMm - stackMm : 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-stone-200 bg-stone-50",
        className,
      )}
    >
      <div className="grid gap-3 p-4 pb-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 text-[13px] font-bold text-stone-900">
            {next
              ? t("object_progress_to", { name: objectName(next.id, "name") })
              : t("object_progress_over", { name: objectName(top.id, "name") })}
          </span>
          <b className="shrink-0 text-xl font-semibold tabular-nums text-stone-900">
            {next ? `${cm1(remain)}cm` : `+${len(stackMm - top.heightMm)}`}
          </b>
        </div>
        <div className="grid gap-1">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-stone-200">
            <i
              className="absolute inset-y-0 left-0 rounded-full bg-emerald-700 transition-[width] duration-500"
              style={{ width: `${(Math.min(1, ratio) * 100).toFixed(1)}%` }}
            />
          </div>
          {next && (
            <div className="flex justify-between gap-3 font-[family-name:var(--font-gaegu)] text-[13px] font-bold">
              <span className="min-w-0 truncate text-stone-900">
                {passed ? objectName(passed.id, "name") : "0cm"}
              </span>
              <span className="min-w-0 truncate text-right text-stone-400">
                {objectName(next.id, "name")} · {len(next.heightMm)}
              </span>
            </div>
          )}
        </div>
        <p className="text-[12.5px] leading-relaxed text-stone-500">
          {next
            ? t("progress_remain", {
                cm: cm1(remain),
                count: Math.ceil(remain / Math.max(1, avgDepthMm)),
              })
            : t("object_progress_over_note", {
                name: objectName(top.id, "name"),
                len: len(stackMm - top.heightMm),
              })}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-stone-200 pt-3">
          <span className="whitespace-nowrap text-[12px] font-semibold text-stone-600">
            {t("object_collected")}
            <span className="ml-1.5 tabular-nums text-stone-400">
              {t("object_collected_count", {
                count: passedCount,
                total: STACK_OBJECTS.length,
              })}
            </span>
          </span>
          {/* 사다리 한 칸에 점 하나. 넘은 사물은 채우고 다음 사물은 테두리 */}
          <ol className="flex shrink-0 items-center gap-1" aria-hidden="true">
            {STACK_OBJECTS.map((o) => (
              <li
                key={o.id}
                title={objectName(o.id, "name")}
                className={cn(
                  "size-[7px] rounded-full",
                  o.heightMm <= stackMm
                    ? "bg-emerald-700"
                    : o.id === next?.id
                      ? "border-[1.5px] border-emerald-700"
                      : "bg-stone-300",
                )}
              />
            ))}
          </ol>
        </div>
      </div>
      <StackStats count={count} pages={pages} grams={grams} />
    </div>
  );
}
