"use client";

import type { ReceivedKongsResponse } from "@bookjeok/core";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { formatDate } from "@/shared/utils/format-date";

import { KongAboutDialog } from "../kong-about-dialog";
import { KongBowl } from "../kong-bowl";
import { KongFigure } from "../kong-figure";
import { useSenderNames } from "../kong-owner-row";

interface KongBowlDialogProps {
  data: ReceivedKongsResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 기록을 누르면 그날 상세로. 없으면 목록이 눌리지 않는다 */
  onOpenDate?: (date: string) => void;
}

/** 내 콩 종지. 받은 콩을 종지에 담아 보여 주고, 어떤 기록에 누가 보냈는지 늘어놓는다 */
export function KongBowlDialog({
  data,
  open,
  onOpenChange,
  onOpenDate,
}: KongBowlDialogProps) {
  const t = useTranslations("kong.bowl");
  const locale = useLocale();
  const senderNames = useSenderNames();
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* 칸을 폭에 묶어야 한 줄로 자르는 긴 제목·이름이 칸을 넓히지 않는다(가로 스크롤 방지) */}
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] custom-scrollbar grid-cols-1 overflow-y-auto rounded-2xl px-5 pb-4 pt-6 sm:max-w-[440px] sm:px-6">
          <div>
            <DialogTitle className="font-[family-name:var(--font-gaegu)] text-[30px] font-bold leading-none text-stone-900">
              {t("title")}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-[13px] text-stone-500">
              {t("desc", { count: data.total })}
            </DialogDescription>
          </div>

          <div className="pt-2">
            <KongBowl count={data.total} />
          </div>

          <ul
            aria-label={t("list_label")}
            className="border-t border-stone-100"
          >
            {data.logs.map((log) => {
              const content = (
                <>
                  <span className="relative h-[54px] w-9 shrink-0 overflow-hidden rounded-[2px] border border-stone-900 bg-stone-100">
                    {log.book.image && (
                      <Image
                        src={log.book.image}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-semibold text-stone-900">
                      {log.book.title}
                    </span>
                    <span className="block text-xs text-stone-400">
                      {formatDate(log.date, locale, "full")}
                    </span>
                    <span className="mt-0.5 line-clamp-1 text-xs text-stone-500">
                      {senderNames(log)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5 font-[family-name:var(--font-gaegu)] text-xl font-bold tabular-nums text-stone-900">
                    <KongFigure size={20} />
                    {log.count.toLocaleString(locale)}
                  </span>
                </>
              );
              return (
                <li key={log.logId} className="border-b border-stone-100">
                  {onOpenDate ? (
                    <button
                      type="button"
                      onClick={() => onOpenDate(log.date)}
                      aria-label={t("go", {
                        title: log.book.title,
                        count: log.count,
                      })}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-1 py-3 text-left outline-none hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-stone-700"
                    >
                      {content}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 px-1 py-3">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => setAboutOpen(true)}
            className="mx-auto inline-block cursor-pointer py-1.5 font-[family-name:var(--font-gaegu)] text-[17px] text-stone-500 underline decoration-dotted underline-offset-4 hover:text-stone-800"
          >
            {t("what")}
          </button>
        </DialogContent>
      </Dialog>
      <KongAboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
}
