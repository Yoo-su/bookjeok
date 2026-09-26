"use client";

import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/shared/utils";

import { cm1, nextGoalTimes } from "../hooks/use-tower-copy";
import { BODY_PARTS, type TowerStatus, TRACK_PARTS } from "../lib/status";

interface TowerProgressProps {
  status: TowerStatus;
  towerMm: number;
  userMm: number;
  avgDepthMm: number;
  count: number;
  pages: number;
  grams: number;
  className?: string;
  comparisonName?: string;
}

/** 내 키까지 얼마나 쌓였는지와 올해 합계 */
export function TowerProgress({
  status,
  towerMm,
  userMm,
  avgDepthMm,
  count,
  pages,
  grams,
  className,
  comparisonName,
}: TowerProgressProps) {
  const t = useTranslations("reading_log.tower");
  const locale = useLocale();
  const remain = userMm - towerMm;
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
        "overflow-hidden rounded-2xl border border-stone-200 bg-stone-50",
        className,
      )}
    >
      <div className="grid gap-3 p-4 pb-3.5">
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
                cm: cm1(userMm * nextGoalTimes(status.ratio) - towerMm),
              })
            : t("progress_remain", {
                cm: cm1(remain),
                count: Math.ceil(remain / Math.max(1, avgDepthMm)),
              })}
        </p>
      </div>
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
    </div>
  );
}
