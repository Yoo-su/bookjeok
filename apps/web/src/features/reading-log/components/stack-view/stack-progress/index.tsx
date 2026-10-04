"use client";

import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/shared/utils";

import { cm1, nextGoalTimes } from "../hooks/use-stack-copy";
import { BODY_PARTS, type StackStatus, TRACK_PARTS } from "../lib/status";

interface StackProgressProps {
  status: StackStatus;
  stackMm: number;
  userMm: number;
  avgDepthMm: number;
  count: number;
  pages: number;
  grams: number;
  className?: string;
  comparisonName?: string;
  /** 테두리·배경 없이. 이미 상자 안(dock 패널)에 놓일 때 상자 속 상자를 피함 */
  plain?: boolean /** 합계 줄을 빼고 그림. 놓는 쪽이 따로 넓게 둘 때 */;
  hideStats?: boolean;
}

/** 내 키까지 얼마나 쌓였는지와 올해 합계 */
export function StackProgress({
  status,
  stackMm,
  userMm,
  avgDepthMm,
  count,
  pages,
  grams,
  className,
  comparisonName,
  plain = false,
  hideStats = false,
}: StackProgressProps) {
  const t = useTranslations("reading_log.stack");
  const remain = userMm - stackMm;
  const over = status.ratio >= 1;
  const markers = comparisonName
    ? [0.25, 0.5, 0.75, 1].map((ratio) => ({ ratio, label: `${ratio * 100}%` }))
    : TRACK_PARTS.map((key) => ({
        ratio: BODY_PARTS.find((part) => part.key === key)?.ratio ?? 1,
        label: t(`parts.${key}.name`),
      }));

  return (
    <div
      className={cn(
        !plain &&
          "overflow-hidden rounded-2xl border border-stone-200 bg-stone-50",
        className,
      )}
    >
      <div
        className={cn(
          "grid gap-3",
          plain ? !hideStats && "pb-3" : "p-4 pb-3.5",
        )}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-bold text-stone-900">
            {comparisonName
              ? t(over ? "progress_over_author" : "progress_to_author", {
                  name: comparisonName,
                })
              : over
                ? t("progress_over")
                : t("progress_to_height")}
          </span>
          <b className="text-xl font-semibold tabular-nums text-stone-900">
            {over ? `+${cm1(-remain)}` : `${Math.floor(status.ratio * 100)}%`}
          </b>
        </div>
        <div className="relative h-[34px]">
          <div className="absolute inset-x-0 top-1.5 h-1.5 overflow-hidden rounded-full bg-stone-200">
            <i
              className="absolute inset-y-0 left-0 rounded-full bg-emerald-700 transition-[width] duration-500"
              style={{
                width: `${Math.min(100, status.ratio * 100).toFixed(1)}%`,
              }}
            />
          </div>
          {markers.map(({ ratio, label }, i) => {
            const last = i === markers.length - 1;
            return (
              <div
                key={ratio}
                className="absolute top-0.5 h-3.5 border-l-[1.5px] border-white"
                style={{ left: `${ratio * 100}%` }}
              >
                <span
                  className={cn(
                    "absolute top-4 whitespace-nowrap font-[family-name:var(--font-gaegu)] text-[13px] font-bold",
                    last ? "-translate-x-full" : "-translate-x-1/2",
                    ratio <= status.ratio ? "text-stone-900" : "text-stone-400",
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[12.5px] leading-relaxed text-stone-500">
          {over
            ? t(comparisonName ? "progress_double_author" : "progress_double", {
                name: comparisonName ?? "",
                times: nextGoalTimes(status.ratio),
                cm: cm1(userMm * nextGoalTimes(status.ratio) - stackMm),
              })
            : t("progress_remain", {
                cm: cm1(remain),
                count: Math.ceil(remain / Math.max(1, avgDepthMm)),
              })}
        </p>
      </div>
      {!hideStats && (
        <StackStats count={count} pages={pages} grams={grams} plain={plain} />
      )}
    </div>
  );
}

/** 올해 합계(권수·쪽수·무게). 진행률 카드 아래에 붙인다 */
export function StackStats({
  count,
  pages,
  grams,
  plain = false,
}: {
  count: number;
  pages: number;
  grams: number;
  /** 카드 안쪽 여백 없이. 첫 칸을 글과 같은 줄에 맞춤 */
  plain?: boolean;
}) {
  const t = useTranslations("reading_log.stack");
  const locale = useLocale();
  return (
    <dl className="grid grid-cols-3 border-t border-stone-200">
      {[
        {
          label: t("stat_count"),
          value: count.toLocaleString(locale),
          unit: t("count_unit", { count }),
        },
        {
          label: t("stat_pages"),
          value: pages.toLocaleString(locale),
          unit: t("pages_unit"),
        },
        {
          label: t("stat_weight"),
          value: (grams / 1000).toFixed(1),
          unit: "kg",
        },
      ].map((s, i) => (
        <div
          key={s.label}
          className={cn(
            "grid min-w-0 gap-1 py-3 pl-3.5 pr-2.5",
            plain && "pl-3 pr-2 first:pl-0",
            i > 0 && "border-l border-stone-200",
          )}
        >
          <dt className="text-[11px] text-stone-500">{s.label}</dt>
          <dd className="whitespace-nowrap text-[15px] font-semibold tabular-nums tracking-tight text-stone-900">
            {s.value}
            <small className="ml-0.5 text-[11px] font-semibold text-stone-500">
              {s.unit.trim()}
            </small>
          </dd>
        </div>
      ))}
    </dl>
  );
}
