"use client";

import { useReceivedKongsQuery } from "@bookjeok/react-query";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { KongAboutDialog } from "../kong-about-dialog";
import { KongBowlDialog } from "../kong-bowl-dialog";
import { KongFigure } from "../kong-figure";

interface KongPillProps {
  /** 종지에서 기록을 누르면 그날 상세로 */
  onOpenDate?: (date: string) => void;
}

/**
 * 독서기록 hero의 받은 콩 알약. 사진 위라 연필 그림이 묻히지 않게 종이 바탕을 깐다.
 * 받은 콩이 있으면 종지를, 없으면 자는 콩과 「콩이란?」을 연다
 */
export function KongPill({ onOpenDate }: KongPillProps) {
  const t = useTranslations("kong.pill");
  const locale = useLocale();
  const { data } = useReceivedKongsQuery();
  const [bowlOpen, setBowlOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // 받기 전에 0알로 그렸다가 숫자로 바뀌면 깜빡여 보여 자리를 비워 둔다
  if (!data) return null;
  const empty = data.total === 0;

  return (
    <>
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => (empty ? setAboutOpen(true) : setBowlOpen(true))}
        aria-label={empty ? t("aria_empty") : t("aria", { count: data.total })}
        className="relative flex h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-stone-900 bg-[#FBF8F2] py-1 pl-[52px] pr-4 text-[13px] font-semibold text-stone-700 shadow-[3px_3px_0_#1c1917] outline-none transition-[translate,box-shadow] duration-150 pointer-fine:hover:-translate-x-px pointer-fine:hover:-translate-y-px pointer-fine:hover:shadow-[4px_4px_0_#1c1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#1c1917] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
      >
        {/* 알약 위로 머리가 빼꼼 나온다 */}
        <span className="absolute -top-3 left-2">
          <KongFigure size={40} face={empty ? "sleep" : "smile"} boil />
        </span>
        {empty ? (
          <>
            <span
              aria-hidden="true"
              className="kong-zz absolute -top-4 left-10 font-[family-name:var(--font-gaegu)] text-[15px] text-stone-300"
            >
              z
            </span>
            {t("empty")}
          </>
        ) : (
          <>
            {t("received")}
            <span className="font-[family-name:var(--font-gaegu)] text-2xl font-bold leading-none tabular-nums text-stone-900">
              {data.total.toLocaleString(locale)}
            </span>
          </>
        )}
      </motion.button>
      {!empty && (
        <KongBowlDialog
          data={data}
          open={bowlOpen}
          onOpenChange={setBowlOpen}
          onOpenDate={
            onOpenDate &&
            ((date) => {
              setBowlOpen(false);
              onOpenDate(date);
            })
          }
        />
      )}
      <KongAboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
}
