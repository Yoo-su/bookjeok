"use client";

import type { ReadingTowerBook } from "@bookjeok/core";
import { usePublicReadingTowerQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "@/shared/components/icons/iconsax";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { READING_LOG_MIN_YEAR } from "../../../constants/ui";
import { cm1 } from "../hooks/use-tower-copy";
import { TowerBookDialog } from "../tower-book-dialog";
import { TowerStackList } from "../tower-stack-list";
import { TowerStage } from "../tower-stage";

interface PublicReadingTowerProps {
  handle: string;
  nickname: string;
  /** 처음 보여줄 연도. 가장 최근 기록의 연도 */
  initialYear: number;
}

/**
 * 공개 프로필의 책탑. 주인의 키는 기기에만 있으므로 캐릭터 없이 책탑만 세운다.
 * 공유·키 입력은 없다.
 */
export function PublicReadingTower({
  handle,
  nickname,
  initialYear,
}: PublicReadingTowerProps) {
  const t = useTranslations("reading_log.tower");
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(initialYear);
  const { data, isLoading, isError, refetch } = usePublicReadingTowerQuery(
    handle,
    year,
  );
  const viewer = useAuthStore((s) => s.user);

  const books = useMemo(() => data?.items ?? [], [data]);
  const towerMm = useMemo(
    () => books.reduce((a, b) => a + b.depth, 0),
    [books],
  );
  const estimated = books.filter((b) => b.sizeSource === "estimated").length;

  const [replayKey, setReplayKey] = useState(0);
  const [selected, setSelected] = useState<ReadingTowerBook | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const stackRef = useRef<HTMLElement>(null);
  const selectedBelowMm = selected
    ? books
        .slice(
          0,
          books.findIndex((b) => b.logId === selected.logId),
        )
        .reduce((a, b) => a + b.depth, 0)
    : 0;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1.5">
          <p className="flex items-center gap-2.5 text-[10.5px] font-bold uppercase tracking-[0.3em] text-stone-500 before:h-px before:w-6 before:bg-current">
            {t("kicker", { year })}
          </p>
          {books.length > 0 && (
            <p className="font-serif text-[clamp(28px,6vw,40px)] font-semibold leading-none tracking-tight text-stone-900 tabular-nums">
              {books.length}
              <span className="text-[0.52em] tracking-normal text-stone-500">
                {t("count_unit", { count: books.length })}
              </span>
              , {cm1(towerMm)}
              <span className="text-[0.52em] tracking-normal text-stone-500">
                {t("height_unit")}
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setYear((y) => y - 1)}
            disabled={year <= READING_LOG_MIN_YEAR}
            aria-label={t("public.prev_year")}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900 disabled:cursor-default disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="w-12 text-center font-serif text-lg font-medium tabular-nums text-stone-900">
            {year}
          </span>
          <button
            type="button"
            onClick={() => setYear((y) => y + 1)}
            disabled={year >= thisYear}
            aria-label={t("public.next_year")}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900 disabled:cursor-default disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[380px] w-full rounded-2xl md:h-[440px]" />
      ) : isError ? (
        <div className="grid justify-items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-stone-900">
            {t("error_title")}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="cursor-pointer rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
          >
            {t("retry")}
          </button>
        </div>
      ) : books.length === 0 ? (
        <p className="rounded-2xl border border-stone-200 bg-stone-50 px-6 py-12 text-center text-sm text-stone-500">
          {t("public.empty", { name: nickname, year })}
        </p>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white bg-[radial-gradient(#e2e0dd_1.1px,transparent_1.4px)] bg-[length:16px_16px] bg-[position:6px_6px] px-3 pb-1.5 pt-2.5">
          <div className="relative z-[1] flex items-center justify-between px-0.5 pb-1">
            <span className="font-[family-name:var(--font-gaegu)] text-[15px] font-bold text-stone-400">
              {t("scale_hint")}
            </span>
            <button
              type="button"
              onClick={() => setReplayKey((k) => k + 1)}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-500 hover:text-stone-900 pointer-fine:h-7"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("replay")}
            </button>
          </div>
          <TowerStage
            // 연도마다 새 무대로 책을 다시 떨어뜨린다
            key={year}
            books={books}
            towerMm={towerMm}
            className="h-[380px] md:h-[440px]"
            replayKey={replayKey}
            onTowerClick={() =>
              stackRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
            towerClickLabel={t("view_stack")}
            ariaLabel={t("public.stage_label", {
              name: nickname,
              year,
              count: books.length,
              height: cm1(towerMm),
            })}
          />
          {estimated > 0 && (
            <p className="px-1 pb-1 text-[11.5px] text-stone-400">
              {t("estimated_note", { count: estimated })}
            </p>
          )}
        </div>
      )}

      {books.length > 0 && (
        <TowerStackList
          key={year}
          ref={stackRef}
          books={books}
          onBookClick={(b) => {
            setSelected(b);
            setBookOpen(true);
          }}
        />
      )}

      <TowerBookDialog
        book={selected}
        open={bookOpen}
        belowMm={selectedBelowMm}
        onOpenChange={setBookOpen}
      />

      {viewer?.handle !== handle && (
        <Link
          href={PATHS.READING_LOG}
          className="inline-flex items-center gap-1 justify-self-end py-1.5 text-[13px] font-semibold text-stone-500 hover:text-stone-900"
        >
          {t("public.cta")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
