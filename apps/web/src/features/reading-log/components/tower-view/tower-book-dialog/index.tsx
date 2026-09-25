"use client";

import type { ReadingTowerBook } from "@bookjeok/core";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";

import { cm1 } from "../hooks/use-tower-copy";

interface TowerBookDialogProps {
  book: ReadingTowerBook | null;
  open: boolean;
  /** 이 책 아래에 깔린 책들의 두께 합(mm) */
  belowMm: number;
  onOpenChange: (open: boolean) => void;
}

/** 책탑에서 책 한 권을 눌렀을 때 */
export function TowerBookDialog({
  book,
  open,
  belowMm,
  onOpenChange,
}: TowerBookDialogProps) {
  const t = useTranslations("reading_log.tower.sheet");
  const locale = useLocale();
  if (!book) return null;

  const date = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${book.date}T00:00:00`));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <div className="grid grid-cols-[96px_1fr] items-start gap-4 sm:grid-cols-[108px_1fr] sm:gap-5">
          {book.image ? (
            <Image
              src={book.image}
              alt={t("cover_alt", { title: book.title })}
              width={108}
              height={156}
              sizes="108px"
              className="h-auto w-full rounded-[3px] border-[1.5px] border-stone-900 shadow-[4px_4px_0_#1c1917]"
            />
          ) : (
            <div className="aspect-[2/3] w-full rounded-[3px] border-[1.5px] border-stone-900 bg-stone-100" />
          )}
          <div className="grid gap-2 pr-6">
            <DialogTitle className="text-lg font-bold leading-snug tracking-tight text-stone-900 text-balance">
              {book.title}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-stone-500">
              {book.author} · {book.publisher}
            </DialogDescription>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-blue-600/10 px-2 py-1 text-[11.5px] font-medium tabular-nums text-blue-700">
                {t("tower_add", { cm: cm1(book.depth) })}
              </span>
              {book.pages != null && (
                <span className="rounded-full bg-stone-100 px-2 py-1 text-[11.5px] tabular-nums">
                  {t("pages", { count: book.pages })}
                </span>
              )}
              <span className="rounded-full bg-stone-100 px-2 py-1 text-[11.5px] tabular-nums">
                {book.sizeSource === "estimated"
                  ? t("estimated")
                  : t("size", { w: book.width, h: book.height, d: book.depth })}
              </span>
              {book.binding && (
                <span className="rounded-full bg-stone-100 px-2 py-1 text-[11.5px]">
                  {book.binding}
                </span>
              )}
            </div>
            <p className="text-[13px] text-stone-500">
              {t("finished", { date })}
            </p>
            <p className="text-[13px] text-stone-500">
              {t("position", { cm: cm1(belowMm) })}
            </p>
          </div>
        </div>
        {book.memo ? (
          <p className="rounded-xl bg-stone-100 px-3.5 py-3 font-[family-name:var(--font-gaegu)] text-[19px] font-bold leading-snug text-stone-900">
            “{book.memo}”
          </p>
        ) : (
          <p className="rounded-xl bg-stone-100 px-3.5 py-3 text-[13px] text-stone-500">
            {t("no_memo")}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
