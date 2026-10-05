"use client";

import type { ReadingStackBook } from "@bookjeok/core";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { cn } from "@/shared/utils";

import { cm1, useStackCopy } from "../hooks/use-stack-copy";
import { objectCollection } from "../lib/collection";
import { buildObject } from "../lib/figure";
import { OBJECT_ART, STACK_OBJECTS } from "../lib/objects";
import { bookColor } from "../lib/scene";
import { SceneNodes } from "../lib/scene-svg";
import type { SceneColors, StackObject } from "../lib/types";

const COLORS: SceneColors = {
  paper: "#FFFFFF",
  ink: "#1C1917",
  pen: "#047857",
  muted: "#78716C",
  faint: "#A8A29E",
};

/** 카드 그림 칸(뷰박스 단위). 카드 폭에 맞춰 늘어난다 */
const ART = { w: 100, h: 80, shadow: 7 };

/** 도감 카드의 사물 그림. 못 모은 사물은 그림 윤곽 그대로 한 색으로 메운 실루엣이다 */
function ObjectArt({
  object,
  heldColor,
  silhouette,
}: {
  object: StackObject;
  heldColor: string;
  /** 실루엣 색. 없으면 그대로 그린다 */
  silhouette?: string;
}) {
  const filterId = useId();
  const items = useMemo(() => {
    const [x0, x1] = OBJECT_ART[object].x;
    const k = Math.min((ART.h - ART.shadow) / 1000, (ART.w - 8) / (x1 - x0));
    return buildObject({
      fx: (ART.w - (x1 - x0) * k) / 2 - x0 * k,
      fy: ART.h - ART.shadow - 1000 * k,
      k,
      colors: COLORS,
      u: 0.85,
      object,
      heldColor,
      boil: false,
    });
  }, [object, heldColor]);
  return (
    <svg
      viewBox={`0 0 ${ART.w} ${ART.h}`}
      aria-hidden="true"
      className="block h-auto w-full overflow-visible"
    >
      {silhouette && (
        <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
          <feFlood floodColor={silhouette} />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
      )}
      <g filter={silhouette ? `url(#${filterId})` : undefined}>
        <SceneNodes items={items} />
      </g>
    </svg>
  );
}

export interface StackObjectCollectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  /** 그해 쌓은 책(완독일 오름차순) */
  books: ReadingStackBook[];
}

/**
 * 한 해 사물 도감. 쌓은 책이 사물 높이에 닿으면 그 책의 표지색으로 칠해져 모이고,
 * 다음 목표는 이름과 남은 높이를, 그 뒤는 실루엣과 높이만 보여 준다
 */
export function StackObjectCollection({
  open,
  onOpenChange,
  year,
  books,
}: StackObjectCollectionProps) {
  const t = useTranslations("reading_log.stack.collection");
  const locale = useLocale();
  const { objectName, len } = useStackCopy();
  const { collected, next, stackMm } = useMemo(
    () => objectCollection(books),
    [books],
  );
  const byId = new Map(collected.map((c) => [c.spec.id, c]));
  const lastId = STACK_OBJECTS[STACK_OBJECTS.length - 1].id;
  const dateFormat = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94dvh] gap-0 overflow-y-auto p-0 sm:max-w-[560px]">
        <header className="grid gap-2 px-6 pt-6">
          <div className="flex items-baseline justify-between gap-3 pr-8">
            <DialogTitle className="font-serif text-[24px] font-semibold tracking-tight text-stone-900">
              {t("title", { year })}
            </DialogTitle>
            <span className="shrink-0 font-serif text-[20px] font-semibold tabular-nums text-stone-900">
              {collected.length}
              <span className="text-[0.7em] text-stone-400">
                /{STACK_OBJECTS.length}
              </span>
            </span>
          </div>
          <DialogDescription className="text-[13px] leading-relaxed text-stone-500">
            {collected.length === 0
              ? t("empty")
              : next
                ? t("description")
                : t("all")}
          </DialogDescription>
        </header>

        <ol className="grid grid-cols-3 gap-2 px-4 pb-5 pt-4 sm:grid-cols-4 sm:gap-2.5 sm:px-6">
          {STACK_OBJECTS.map((o) => {
            const got = byId.get(o.id);
            const isNext = o.id === next?.id;
            // 13번째가 한 줄에 홀로 남지 않게 가장 큰 사물은 한 줄을 다 쓰는 마지막 목표로 둔다
            const last = o.id === lastId;
            return (
              <li
                key={o.id}
                className={cn(
                  "grid gap-1.5 rounded-xl border px-2 pb-2.5 pt-3",
                  last
                    ? "col-span-3 grid-cols-[96px_minmax(0,1fr)] items-center gap-x-3 px-3 pb-3 sm:col-span-4"
                    : "content-start",
                  got
                    ? "border-stone-200 bg-white"
                    : isNext
                      ? "border-dashed border-emerald-700/50 bg-emerald-50/40"
                      : "border-stone-200/70 bg-stone-50",
                )}
              >
                <div className="px-1.5">
                  <ObjectArt
                    object={o.id}
                    heldColor={got ? bookColor(got.book) : "#E7E5E4"}
                    silhouette={
                      got ? undefined : isNext ? "#D6D3D1" : "#E7E5E4"
                    }
                  />
                </div>
                <div
                  className={cn(
                    "grid gap-0.5",
                    last ? "text-left" : "text-center",
                  )}
                >
                  {last && (
                    <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-stone-400">
                      {t("final_label")}
                    </span>
                  )}
                  <span
                    className={cn(
                      "truncate font-[family-name:var(--font-gaegu)] text-[15px] font-bold leading-tight",
                      got || isNext ? "text-stone-900" : "text-stone-300",
                    )}
                  >
                    {got || isNext ? objectName(o.id, "name") : "?"}
                  </span>
                  <span className="text-[11px] tabular-nums text-stone-400">
                    {len(o.heightMm)}
                  </span>
                  {got ? (
                    <span
                      title={got.book.title}
                      className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-stone-500"
                    >
                      {t("collected_by", {
                        date: dateFormat.format(
                          new Date(`${got.book.date}T00:00:00`),
                        ),
                        title: got.book.title,
                      })}
                    </span>
                  ) : isNext ? (
                    <span className="mt-0.5 text-[11px] font-semibold tabular-nums text-emerald-700">
                      {t("next_remain", { cm: cm1(o.heightMm - stackMm) })}
                    </span>
                  ) : (
                    <span className="sr-only">{t("locked")}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
