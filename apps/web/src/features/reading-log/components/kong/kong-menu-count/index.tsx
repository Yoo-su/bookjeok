"use client";

import { useReceivedKongsQuery } from "@bookjeok/react-query";
import { useLocale, useTranslations } from "next-intl";

import { KongFigure } from "../kong-figure";

/**
 * 프로필 메뉴 「독서 기록」 옆의 받은 콩 수. 눈길을 끌지 않게 메뉴 안에만 두고,
 * 받은 콩이 있을 때만 보인다
 */
export function KongMenuCount() {
  const t = useTranslations("kong.menu");
  const locale = useLocale();
  const { data } = useReceivedKongsQuery();
  if (!data?.total) return null;

  return (
    <span className="ml-auto flex items-center gap-0.5 font-[family-name:var(--font-gaegu)] text-base font-bold leading-none tabular-nums text-stone-700">
      <KongFigure size={16} />
      <span aria-hidden="true">{data.total.toLocaleString(locale)}</span>
      <span className="sr-only">{t("count", { count: data.total })}</span>
    </span>
  );
}
