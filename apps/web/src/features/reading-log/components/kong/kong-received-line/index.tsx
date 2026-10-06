"use client";

import type { ReceivedKongLog } from "@bookjeok/core";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/utils/cn";

import { PokeableKong, useSenderNames } from "../kong-owner-row";

/** 목록·하루 상세의 기록 카드에 붙는 한 줄. 받은 콩 수와 보낸 사람 */
export function KongReceivedLine({
  log,
  className,
}: {
  log: ReceivedKongLog | undefined;
  className?: string;
}) {
  const t = useTranslations("kong.owner");
  const senderNames = useSenderNames();
  if (!log) return null;
  // 이름 칸을 minmax(0, 1fr)로 둬야 ScrollArea처럼 내용에 맞춰 늘어나는 부모를 넓히지 않는다
  return (
    <p
      className={cn(
        "grid min-w-0 grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-1.5 text-xs text-stone-500",
        className,
      )}
    >
      <PokeableKong size={20} />
      <span className="whitespace-nowrap font-[family-name:var(--font-gaegu)] text-[15px] font-bold text-stone-800">
        {t("count", { count: log.count })}
      </span>
      <span className="truncate">{senderNames(log)}</span>
    </p>
  );
}
