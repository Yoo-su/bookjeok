"use client";

import type { ReadingStackBook } from "@bookjeok/core";
import { useReadingStackQuery } from "@bookjeok/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { RotateCcw, Share2 } from "@/shared/components/icons/iconsax";
import { cn } from "@/shared/utils";

import { useStackSettingsStore } from "../../../stores/use-stack-settings-store";
import { HandUnderline } from "../hand-underline";
import { useStackComparison } from "../hooks/use-stack-comparison";
import { cm1, useStackCopy } from "../hooks/use-stack-copy";
import { BODY_PARTS, type StackStatus, stackStatus } from "../lib/status";
import { StackBookDialog } from "../stack-book-dialog";
import { StackCollectionEntry } from "../stack-collection-entry";
import { StackHeightChip } from "../stack-height-chip";
import { StackObjectCollection } from "../stack-object-collection";
import { StackObjectProgress } from "../stack-object-progress";
import { StackOrderList } from "../stack-order-list";
import { StackProgress } from "../stack-progress";
import { StackShareDialog } from "../stack-share-dialog";
import { StackSkeleton } from "../stack-skeleton";
import {
  STACK_INTRO_LAND_MS,
  stackIntroStepMs,
  StackStage,
  type StackStageObject,
  type StackStagePerson,
} from "../stack-stage";

/** 쌓은 책이 무릎 아래면 사람 옆에서는 티가 안 나므로 사물부터 보여 준다 */
const OBJECT_FIRST_RATIO =
  BODY_PARTS.find((p) => p.key === "knee")?.ratio ?? 0.28;

/**
 * 독서 키재기. 한 해 동안 읽은 책을 실제 두께로 쌓고, 내 키만 한 캐릭터와 나란히 세운다.
 */
export function ReadingStack({ year }: { year: number }) {
  const {
    t,
    locale,
    sceneLabels,
    lede,
    shareSubline,
    objectName,
    len,
    objectScene,
    objectLede,
    objectShareSubline,
  } = useStackCopy();
  const { data, isLoading, isError, refetch } = useReadingStackQuery(year);
  const { character, heightCm, author } = useStackComparison();
  const comparisonName = author ? t(`authors.${author}`) : undefined;
  const userMm = heightCm * 10;
  const handle = useAuthStore((s) => s.user?.handle);

  const books = useMemo(() => data?.items ?? [], [data]);
  const totals = useMemo(() => {
    const stackMm = books.reduce((a, b) => a + b.depth, 0);
    return {
      stackMm,
      pages: books.reduce((a, b) => a + (b.pages ?? 0), 0),
      grams: books.reduce((a, b) => a + b.weight, 0),
      avgDepthMm: books.length ? stackMm / books.length : 20,
      estimated: books.filter((b) => b.sizeSource === "estimated").length,
    };
  }, [books]);
  const status = stackStatus(totals.stackMm, userMm);
  const savedMode = useStackSettingsStore((s) => s.compareMode);
  const setMode = useStackSettingsStore((s) => s.setCompareMode);
  const mode =
    savedMode ?? (status.ratio < OBJECT_FIRST_RATIO ? "object" : "person");
  const objectStage = useMemo<StackStageObject>(() => {
    const o = objectScene(totals.stackMm, totals.avgDepthMm);
    return { spec: o.object, labels: o.labels };
  }, [objectScene, totals]);

  const labelsFor = useCallback(
    (s: StackStatus, mm: number) =>
      sceneLabels({
        status: s,
        stackMm: totals.stackMm,
        userMm: mm,
        avgDepthMm: totals.avgDepthMm,
      }),
    [sceneLabels, totals],
  );
  const person = useMemo<StackStagePerson>(
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
    const step = stackIntroStepMs(books.length);
    const end = books.length * step + STACK_INTRO_LAND_MS;
    const tick = (now: number) => {
      const landed = Math.max(
        0,
        Math.min(
          books.length,
          Math.floor((now - t0 - STACK_INTRO_LAND_MS) / step) + 1,
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
  const [selected, setSelected] = useState<ReadingStackBook | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const stackRef = useRef<HTMLElement>(null);
  const handleBookClick = useCallback((b: ReadingStackBook) => {
    setSelected(b);
    setBookOpen(true);
  }, []);

  if (isLoading) return <StackSkeleton />;

  // 에러를 빈 화면으로 보여주면 기록이 사라진 줄 안다
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
  const shownMm = counter?.mm ?? totals.stackMm;
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
              <HandUnderline />
            </span>
          </h3>
        ) : (
          <h3 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
            {t("empty_title", { year })}
          </h3>
        )}
        <p className="max-w-[48ch] text-[15px] leading-relaxed text-stone-500">
          {mode === "object"
            ? objectLede({
                stackMm: totals.stackMm,
                year,
                hasBooks: books.length > 0,
              })
            : lede({
                status,
                stackMm: totals.stackMm,
                userMm,
                year,
                hasBooks: books.length > 0,
              })}
        </p>
      </header>

      <section className="grid gap-3.5 md:grid-cols-[minmax(0,1fr)_288px] md:items-start md:gap-x-5">
        <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white bg-[radial-gradient(#e2e0dd_1.1px,transparent_1.4px)] bg-[length:16px_16px] bg-[position:6px_6px] px-3 pb-1.5 pt-2.5">
          <div className="relative z-[1] flex flex-wrap items-center justify-between gap-2 px-0.5 pb-1">
            <div
              role="group"
              aria-label={t("mode_label")}
              className="inline-flex shrink-0 gap-0.5 rounded-full bg-stone-100 p-[3px]"
            >
              {(["object", "person"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "min-h-8 cursor-pointer whitespace-nowrap rounded-full px-3.5 text-[12.5px] font-semibold transition-colors pointer-fine:min-h-6",
                    mode === m
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-500 hover:text-stone-700",
                  )}
                >
                  {t(m === "object" ? "mode_object" : "mode_person")}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {mode === "person" && <StackHeightChip />}
              {books.length > 0 && (
                <button
                  type="button"
                  onClick={() => setReplayKey((k) => k + 1)}
                  aria-label={t("replay")}
                  className="inline-flex h-9 min-w-9 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-stone-200 bg-white px-2.5 text-xs font-semibold text-stone-500 hover:text-stone-900 pointer-fine:h-7 pointer-fine:min-w-7 sm:px-3"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {/* 좁은 화면은 아이콘만. 탭·키 버튼과 한 줄에 두려는 것 */}
                  <span className="hidden sm:inline">{t("replay")}</span>
                </button>
              )}
            </div>
          </div>
          <StackStage
            books={books}
            stackMm={totals.stackMm}
            person={person}
            object={mode === "object" ? objectStage : undefined}
            replayKey={replayKey}
            onIntroStart={handleIntroStart}
            onStackClick={() =>
              stackRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
            stackClickLabel={t("view_stack")}
            ariaLabel={
              mode === "object"
                ? t("object_stage_label", {
                    count: books.length,
                    height: cm1(totals.stackMm),
                    name: objectName(objectStage.spec.id, "name"),
                    len: len(objectStage.spec.heightMm),
                  })
                : t(author ? "author_stage_label" : "stage_label", {
                    name: comparisonName ?? "",
                    count: books.length,
                    height: cm1(totals.stackMm),
                    me: heightCm,
                  })
            }
          />
          {(mode === "person" || totals.estimated > 0) && (
            <p className="flex flex-wrap gap-x-2 px-1 pb-1 text-[11.5px] text-stone-400">
              {/* 사물 무대는 축척이 사물마다 달라 눈금 간격을 적지 않는다 */}
              {mode === "person" && <span>{t("scale_hint")}</span>}
              {totals.estimated > 0 && (
                <span>{t("estimated_note", { count: totals.estimated })}</span>
              )}
            </p>
          )}
        </div>

        <div className="grid content-start gap-3.5">
          {mode === "object" ? (
            <StackObjectProgress
              stackMm={totals.stackMm}
              avgDepthMm={totals.avgDepthMm}
              count={books.length}
              pages={totals.pages}
              grams={totals.grams}
              onOpenCollection={() => setCollectionOpen(true)}
            />
          ) : (
            <StackProgress
              comparisonName={comparisonName}
              status={status}
              stackMm={totals.stackMm}
              userMm={userMm}
              avgDepthMm={totals.avgDepthMm}
              count={books.length}
              pages={totals.pages}
              grams={totals.grams}
            />
          )}
          {mode === "person" && (
            <StackCollectionEntry
              stackMm={totals.stackMm}
              onOpen={() => setCollectionOpen(true)}
            />
          )}
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
        <StackOrderList
          ref={stackRef}
          books={books}
          onBookClick={handleBookClick}
        />
      )}

      <StackBookDialog
        book={selected}
        open={bookOpen}
        belowMm={selectedBelowMm}
        onOpenChange={setBookOpen}
        kong={{ owner: true }}
      />
      <StackObjectCollection
        open={collectionOpen}
        onOpenChange={setCollectionOpen}
        year={year}
        books={books}
      />
      {books.length > 0 && (
        <StackShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          year={year}
          books={books}
          stackMm={totals.stackMm}
          userMm={userMm}
          character={character}
          status={status}
          labels={labelsFor(status, userMm)}
          initialMode={mode}
          handle={handle}
          object={{
            ...objectStage,
            subline: objectShareSubline(totals.stackMm),
          }}
          texts={{
            kicker: t("share.kicker", { year }).toUpperCase(),
            count: String(books.length),
            countUnit: t("count_unit", { count: books.length }).trim(),
            height: cm1(totals.stackMm),
            heightUnit: t("height_unit"),
            subline: shareSubline(status, totals.stackMm, userMm),
            brand: t("share.brand"),
            site: handle
              ? t("share.site_profile", { handle })
              : t("share.site"),
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
