"use client";

import { useTranslations } from "next-intl";

import { ChevronRight } from "@/shared/components/icons/iconsax";
import { cn } from "@/shared/utils";

import { useStackCopy } from "../hooks/use-stack-copy";
import { objectLadder, STACK_OBJECTS } from "../lib/objects";

/** 사물 도감 이름·모은 개수와 사다리 점. 버튼이면 끝에 화살표를 붙인다 */
export function CollectionRowContent({
  stackMm,
  button = false,
}: {
  stackMm: number;
  button?: boolean;
}) {
  const t = useTranslations("reading_log.stack");
  const { objectName } = useStackCopy();
  const { next } = objectLadder(stackMm);
  const passedCount = STACK_OBJECTS.filter((o) => o.heightMm <= stackMm).length;
  return (
    <>
      <span className="min-w-0 truncate text-[12px] font-semibold text-stone-600">
        {t("object_collected")}
        <span className="ml-1.5 tabular-nums text-stone-400">
          {t("object_collected_count", {
            count: passedCount,
            total: STACK_OBJECTS.length,
          })}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {/* 사다리 한 칸에 점 하나. 넘은 사물은 채우고 다음 사물은 테두리 */}
        <ol className="flex items-center gap-[3px]" aria-hidden="true">
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
        {button && (
          <ChevronRight
            aria-hidden="true"
            className="h-3.5 w-3.5 text-stone-400 transition-transform group-hover:translate-x-0.5"
          />
        )}
      </span>
    </>
  );
}

/** 사람 무대 옆에 따로 두는 사물 도감 입구. 사물 무대는 진행 카드 안에 같은 줄이 있다 */
export function StackCollectionEntry({
  stackMm,
  onOpen,
  className,
}: {
  stackMm: number;
  onOpen: () => void;
  className?: string;
}) {
  const t = useTranslations("reading_log.stack");
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t("collection.open")}
      className={cn(
        "group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-emerald-700",
        className,
      )}
    >
      <CollectionRowContent stackMm={stackMm} button />
    </button>
  );
}
