"use client";

import { useReceivedKongsQuery } from "@bookjeok/react-query";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { KongAboutDialog } from "../kong-about-dialog";
import { KongBowlDialog } from "../kong-bowl-dialog";
import { KongFigure } from "../kong-figure";

interface KongPillProps {
  /** 종지에서 기록을 누르면 그날 상세로 */
  onOpenDate?: (date: string) => void;
  /** 비공개면 콩을 받을 수 없어 빈 알약은 숨긴다. 이미 받은 콩은 그대로 보인다 */
  isPublic?: boolean;
}

/**
 * 독서기록 hero 모서리의 받은 콩 동그라미. 눈길을 끌지 않게 콩 한 알 크기로 두고,
 * 사진 위라 연필 그림이 묻히지 않게 종이 바탕을 깐다.
 * 받은 콩이 있으면 웃는 콩과 수 배지로 종지를, 없으면 자는 콩으로 「콩이란?」을 연다
 */
export function KongPill({ onOpenDate, isPublic = true }: KongPillProps) {
  const t = useTranslations("kong.pill");
  const { data } = useReceivedKongsQuery();
  const [bowlOpen, setBowlOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // 받기 전에 0알로 그렸다가 숫자로 바뀌면 깜빡여 보여 자리를 비워 둔다
  if (!data) return null;
  const empty = data.total === 0;
  if (empty && !isPublic) return null;

  return (
    <>
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => (empty ? setAboutOpen(true) : setBowlOpen(true))}
        aria-label={empty ? t("aria_empty") : t("aria", { count: data.total })}
        // 사진에 붙인 스티커처럼 살짝 기울이고, 손을 대면 편다
        className="relative flex size-11 rotate-2 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-stone-900 bg-[#FBF8F2] shadow-[3px_3px_0_#1c1917] outline-none transition-[translate,rotate,box-shadow] duration-150 pointer-fine:hover:-translate-x-px pointer-fine:hover:-translate-y-px pointer-fine:hover:rotate-0 pointer-fine:hover:shadow-[4px_4px_0_#1c1917] active:translate-x-0.5 active:translate-y-0.5 active:rotate-0 active:shadow-[1px_1px_0_#1c1917] focus-visible:rotate-0 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
      >
        {/* 동그라미 위로 머리가 빼꼼 나온다 */}
        <span className="absolute -top-3 left-1/2 -translate-x-1/2">
          <KongFigure size={40} face={empty ? "sleep" : "smile"} boil />
        </span>
        {empty ? (
          <span
            aria-hidden="true"
            // 사진 위라 어떤 계절 사진에서도 보이게 종이색 테두리를 두르고, hero 끝을 피해 왼쪽에
            className="kong-zz absolute -top-4 -left-2 font-[family-name:var(--font-gaegu)] text-[15px] font-bold text-stone-800 [text-shadow:0_0_3px_#FBF8F2,0_0_1px_#FBF8F2]"
          >
            z
          </span>
        ) : (
          // 알림 점처럼 보이지 않게 아래 왼쪽에 종이 배지로. 세 자리부터는 달력 칸처럼 줄이고 정확한 수는 종지에
          <span
            aria-hidden="true"
            className="absolute -bottom-1.5 -left-2 flex h-5 min-w-5 items-center justify-center rounded-full border-[1.5px] border-stone-900 bg-[#FBF8F2] px-1 font-[family-name:var(--font-gaegu)] text-[13px] font-bold leading-none tabular-nums text-stone-900"
          >
            {data.total > 99 ? "99+" : data.total}
          </span>
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
