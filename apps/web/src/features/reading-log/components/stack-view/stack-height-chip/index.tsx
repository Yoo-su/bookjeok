"use client";

import { useTranslations } from "next-intl";

import { Edit } from "@/shared/components/icons/iconsax";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/shadcn/popover";
import { cn } from "@/shared/utils";

import { useStackComparison } from "../hooks/use-stack-comparison";
import { useStackPerson } from "../hooks/use-stack-person";
import { STACK_AUTHOR_IDS, STACK_AUTHORS } from "../lib/authors";
import { StackHeightCard } from "../stack-height-card";

/** 내 키·비교 대상을 바꾸는 작은 버튼. 작가를 골라도 내 키와 기본 캐릭터는 보존한다 */
export function StackHeightChip({ className }: { className?: string }) {
  const t = useTranslations("reading_log.stack");
  const person = useStackPerson();
  const { author, setAuthor, heightCm, isDefaultHeight } = useStackComparison();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex min-h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-600 hover:text-stone-900 pointer-fine:min-h-7",
            isDefaultHeight && "border-emerald-200 text-emerald-700",
            className,
          )}
        >
          <Edit className="h-3.5 w-3.5 shrink-0" />
          {author
            ? t("author_chip", {
                name: t(`author_short.${author}`),
                cm: heightCm,
              })
            : isDefaultHeight
              ? t("height_chip_default")
              : t("height_chip", { cm: heightCm })}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[min(640px,80dvh)] w-[min(340px,calc(100vw-32px))] overflow-y-auto p-0"
      >
        <div className="grid gap-3 p-4">
          <p className="text-sm font-semibold">{t("compare_title")}</p>
          <button
            type="button"
            aria-pressed={!author}
            onClick={() => setAuthor(null)}
            className={cn(
              "min-h-10 cursor-pointer rounded-lg border px-3 py-2 text-left text-sm font-medium",
              !author
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-stone-200 text-stone-600",
            )}
          >
            {t("compare_me")}
          </button>
          <p className="text-xs font-medium text-stone-500">
            {t("compare_authors")}
          </p>
          <div className="grid gap-1.5">
            {STACK_AUTHOR_IDS.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={author === id}
                onClick={() => setAuthor(id)}
                className={cn(
                  "flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm",
                  author === id
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-stone-200 text-stone-600 hover:bg-stone-50",
                )}
              >
                <span className="font-medium">{t(`authors.${id}`)}</span>
                <span className="shrink-0 text-xs tabular-nums">
                  {t("approx_height", { cm: STACK_AUTHORS[id].heightCm })}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-stone-500">
            {t("author_height_note")}
            {author && (
              <>
                {" "}
                <a
                  href={STACK_AUTHORS[author].source}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  {t("author_source")}
                </a>
              </>
            )}
          </p>
        </div>
        {!author && (
          <StackHeightCard
            className="rounded-none border-0 border-t"
            heightCm={person.heightCm}
            isDefaultHeight={person.isDefaultHeight}
            character={person.character}
            onHeightChange={person.setHeightCm}
            onCharacterChange={person.setCharacter}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
