"use client";

import type { ReadingTowerBook } from "@bookjeok/core";
import { useReadingTowerQuery } from "@bookjeok/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { RotateCcw, Share2 } from "@/shared/components/icons/iconsax";

import { useTowerComparison } from "../hooks/use-tower-comparison";
import { cm1, useTowerCopy } from "../hooks/use-tower-copy";
import { type TowerStatus, towerStatus } from "../lib/status";
import { TowerBookDialog } from "../tower-book-dialog";
import { TowerHeightChip } from "../tower-height-chip";
import { TowerProgress } from "../tower-progress";
import { TowerShareDialog } from "../tower-share-dialog";
import { TowerSkeleton } from "../tower-skeleton";
import { TowerStackList } from "../tower-stack-list";
import {
  TOWER_INTRO_LAND_MS,
  towerIntroStepMs,
  TowerStage,
  type TowerStagePerson,
} from "../tower-stage";

/**
 * 책탑. 한 해 동안 읽은 책을 실제 두께로 쌓고, 내 키만 한 캐릭터와 나란히 세운다.
 */
export function ReadingTower({ year }: { year: number }) {
  const { t, locale, sceneLabels, lede, shareSubline } = useTowerCopy();
  const { data, isLoading, isError, refetch } = useReadingTowerQuery(year);
  const { character, heightCm, author } = useTowerComparison();
  const comparisonName = author ? t(`authors.${author}`) : undefined;
  const userMm = heightCm * 10;

  const books = useMemo(() => data?.items ?? [], [data]);
  const totals = useMemo(() => {
    const towerMm = books.reduce((a, b) => a + b.depth, 0);
    return {
      towerMm,
      pages: books.reduce((a, b) => a + (b.pages ?? 0), 0),
      grams: books.reduce((a, b) => a + b.weight, 0),
      avgDepthMm: books.length ? towerMm / books.length : 20,
      estimated: books.filter((b) => b.sizeSource === "estimated").length,
    };
  }, [books]);
  const status = towerStatus(totals.towerMm, userMm);

  const labelsFor = useCallback(
    (s: TowerStatus, mm: number) =>
      sceneLabels({
        status: s,
        towerMm: totals.towerMm,
        userMm: mm,
        avgDepthMm: totals.avgDepthMm,
      }),
    [sceneLabels, totals],
  );
  const person = useMemo<TowerStagePerson>(
    () => ({ userMm, character, labelsFor }),
    [userMm, character, labelsFor],
  );

  // 책이 떨어지는 동안 제목의 권수·높이를 함께 올린다
  const [counter, setCounter] = useState<{ count: number; mm: number } | null>(
    null,
  );
  const counterRaf = useRef(0);
  const handleIntroStart = useCallback(() => {
    cancelAnimationFrame(counterRaf.current);
    const cum: number[] = [];
    books.reduce((acc, b) => (cum.push(acc + b.depth), acc + b.depth), 0);
    const t0 = performance.now();
    const step = towerIntroStepMs(books.length);
    const end = books.length * step + TOWER_INTRO_LAND_MS;
    const tick = (now: number) => {
      const landed = Math.max(
        0,
        Math.min(
          books.length,
          Math.floor((now - t0 - TOWER_INTRO_LAND_MS) / step) + 1,
        ),
      );
      // 권수가 그대로인 프레임은 건너뛴다. 새 객체를 넣으면 매 프레임 전체가 다시 그려진다
      setCounter((prev) =>
        prev?.count === landed
          ? prev
          : { count: landed, mm: landed ? cum[landed - 1] : 0 },
      );
      if (now - t0 < end + 80) counterRaf.current = requestAnimationFrame(tick);
      else setCounter(null);
    };
    counterRaf.current = requestAnimationFrame(tick);
  }, [books]);
  useEffect(() => () => cancelAnimationFrame(counterRaf.current), []);

  const [replayKey, setReplayKey] = useState(0);
  // 닫는 동안에도 내용이 보이도록 선택한 책은 닫을 때 비우지 않는다
  const [selected, setSelected] = useState<ReadingTowerBook | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const stackRef = useRef<HTMLElement>(null);
  const handleBookClick = useCallback((b: ReadingTowerBook) => {
    setSelected(b);
    setBookOpen(true);
  }, []);

  if (isLoading) return <TowerSkeleton />;

  // 에러를 빈 탑으로 보여주면 기록이 사라진 줄 안다
  if (isError) {
    return (
      <div className="grid justify-items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-6 py-16 text-center">
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
    );
  }

  const shownCount = counter?.count ?? books.length;
  const shownMm = counter?.mm ?? totals.towerMm;
  const selectedBelowMm = selected
    ? books
        .slice(
          0,
          books.findIndex((b) => b.logId === selected.logId),
        )
        .reduce((a, b) => a + b.depth, 0)
    : 0;

  return (
    <div className="grid gap-6">
      <header className="grid gap-3">
        <p className="flex items-center gap-2.5 text-[10.5px] font-bold uppercase tracking-[0.3em] text-stone-500 before:h-px before:w-6 before:bg-current">
          {t("kicker")}
        </p>
        {books.length > 0 ? (
          <h3 className="font-serif text-[clamp(34px,7.4vw,56px)] font-semibold leading-[1.05] tracking-tight text-stone-900">
            <span className="tabular-nums">{shownCount}</span>
            <span className="text-[0.52em] tracking-normal text-stone-500">
              {t("count_unit", { count: shownCount })}
            </span>
            ,{" "}
            <span className="relative inline-block tabular-nums">
              {cm1(shownMm)}
              <span className="text-[0.52em] tracking-normal text-stone-500">
                {t("height_unit")}
              </span>
              <svg
                viewBox="0 0 100 12"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-[0.18em] left-[-3%] h-[0.24em] w-[106%] overflow-visible"
              >
                {/* 한 번 긋고 바로 아래를 한 번 더 스친 밑줄. 덧선은 오른쪽 끝에서 모인다 */}
                <path
                  d="M2,6.4 C30,5.4 62,6.6 98,3.8"
                  fill="none"
                  stroke="#292524"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M8,10 C38,9.6 70,8.8 94,6.4"
                  fill="none"
                  stroke="#78716C"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.75}
                />
              </svg>
            </span>
          </h3>
        ) : (
          <h3 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
            {t("empty_title", { year })}
          </h3>
        )}
        <p className="max-w-[48ch] text-[15px] leading-relaxed text-stone-500">
          {lede({
            status,
            towerMm: totals.towerMm,
            userMm,
            year,
            hasBooks: books.length > 0,
          })}
        </p>
      </header>

      <section className="grid gap-3.5 md:grid-cols-[minmax(0,1fr)_288px] md:items-start md:gap-x-5">
        <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white bg-[radial-gradient(#e2e0dd_1.1px,transparent_1.4px)] bg-[length:16px_16px] bg-[position:6px_6px] px-3 pb-1.5 pt-2.5">
          <div className="relative z-[1] flex flex-wrap items-center justify-between gap-2 px-0.5 pb-1">
            <span className="font-[family-name:var(--font-gaegu)] text-[15px] font-bold text-stone-400">
              {t("scale_hint")}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <TowerHeightChip />
              {books.length > 0 && (
                <button
                  type="button"
                  onClick={() => setReplayKey((k) => k + 1)}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-500 hover:text-stone-900 pointer-fine:h-7"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t("replay")}
                </button>
              )}
            </div>
          </div>
          <TowerStage
            books={books}
            towerMm={totals.towerMm}
            person={person}
            replayKey={replayKey}
            onIntroStart={handleIntroStart}
            onTowerClick={() =>
              stackRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
            towerClickLabel={t("view_stack")}
            ariaLabel={t(author ? "author_stage_label" : "stage_label", {
              name: comparisonName ?? "",
              count: books.length,
              height: cm1(totals.towerMm),
              me: heightCm,
            })}
          />
          {totals.estimated > 0 && (
            <p className="px-1 pb-1 text-[11.5px] text-stone-400">
              {t("estimated_note", { count: totals.estimated })}
            </p>
          )}
        </div>

        <div className="grid content-start gap-3.5">
          <TowerProgress
            comparisonName={comparisonName}
            status={status}
            towerMm={totals.towerMm}
            userMm={userMm}
            avgDepthMm={totals.avgDepthMm}
            count={books.length}
            pages={totals.pages}
            grams={totals.grams}
          />
          {books.length > 0 && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-stone-900 px-4 py-3.5 text-sm font-bold text-white hover:bg-stone-800"
            >
              <Share2 className="h-4 w-4" />
              {t("share_button")}
            </button>
          )}
        </div>
      </section>

      {books.length > 0 && (
        <TowerStackList
          ref={stackRef}
          books={books}
          onBookClick={handleBookClick}
        />
      )}

      <TowerBookDialog
        book={selected}
        open={bookOpen}
        belowMm={selectedBelowMm}
        onOpenChange={setBookOpen}
      />
      {books.length > 0 && (
        <TowerShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          year={year}
          books={books}
          towerMm={totals.towerMm}
          userMm={userMm}
          character={character}
          status={status}
          labels={labelsFor(status, userMm)}
          texts={{
            kicker: t("share.kicker", { year }).toUpperCase(),
            count: String(books.length),
            countUnit: t("count_unit", { count: books.length }).trim(),
            height: cm1(totals.towerMm),
            heightUnit: t("height_unit"),
            subline: shareSubline(status, totals.towerMm, userMm),
            brand: t("share.brand"),
            site: t("share.site"),
            stats: t("share.stats", {
              pages: totals.pages.toLocaleString(locale),
              kg: (totals.grams / 1000).toFixed(1),
            }),
          }}
        />
      )}
    </div>
  );
}
