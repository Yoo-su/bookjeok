"use client";

import type { ReadingStackBook } from "@bookjeok/core";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";

import { KongOwnerRow } from "../../kong/kong-owner-row";
import { KongVisitorRow } from "../../kong/kong-visitor-row";
import { cm1 } from "../hooks/use-stack-copy";

/** 다이얼로그 맨 아래 콩 줄. 내 기록이면 받은 콩, 남의 기록이면 보내기 */
export type StackBookKong =
  | { owner: true }
  | { owner: false; handle: string; nickname: string };

interface StackBookDialogProps {
  book: ReadingStackBook | null;
  open: boolean;
  /** 이 책 아래에 깔린 책들의 두께 합(mm) */
  belowMm: number;
  onOpenChange: (open: boolean) => void;
  kong?: StackBookKong;
}

/** 쌓은 책에서 한 권을 눌렀을 때 */
export function StackBookDialog({
  book,
  open,
  belowMm,
  onOpenChange,
  kong,
}: StackBookDialogProps) {
  const t = useTranslations("reading_log.stack.sheet");
  const locale = useLocale();
  // 보낸 콩이 앉을 표지
  const [cover, setCover] = useState<HTMLDivElement | null>(null);
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
          <div ref={setCover} className="relative">
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
          </div>
          <div className="grid gap-2 pr-6">
            <DialogTitle className="text-lg font-bold leading-snug tracking-tight text-stone-900 text-balance">
              {book.title}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-stone-500">
              {book.author} · {book.publisher}
            </DialogDescription>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-emerald-700/10 px-2 py-1 text-[11.5px] font-medium tabular-nums text-emerald-700">
                {t("stack_add", { cm: cm1(book.depth) })}
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
          <p className="rounded-xl bg-stone-100 px-3.5 py-3 font-[family-name:var(--font-gaegu)] text-[19px] font-normal leading-snug text-stone-900">
            “{book.memo}”
          </p>
        ) : (
          <p className="rounded-xl bg-stone-100 px-3.5 py-3 text-[13px] text-stone-500">
            {t("no_memo")}
          </p>
        )}
        {kong && (
          <div className="border-t border-dashed border-stone-300 pt-3">
            {kong.owner ? (
              <KongOwnerRow logId={book.logId} />
            ) : (
              <KongVisitorRow
                // 다른 책을 열면 날아가던 콩·말풍선을 처음부터
                key={book.logId}
                logId={book.logId}
                handle={kong.handle}
                nickname={kong.nickname}
                bookTitle={book.title}
                seatHost={cover}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
