"use client";

import type { ReadingTowerBook } from "@bookjeok/core";
import { useReadingTowerQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { saveReturnUrl } from "@/features/auth/utils/return-url";
import {
  cm1,
  useTowerCopy,
} from "@/features/reading-log/components/tower-view/hooks/use-tower-copy";
import { useTowerPerson } from "@/features/reading-log/components/tower-view/hooks/use-tower-person";
import { TOWER_AUTHORS } from "@/features/reading-log/components/tower-view/lib/authors";
import { SAMPLE_BOOKS } from "@/features/reading-log/components/tower-view/lib/sample-books";
import type { TowerStatus } from "@/features/reading-log/components/tower-view/lib/status";
import type { TowerAuthor } from "@/features/reading-log/components/tower-view/lib/types";
import {
  TowerStage,
  type TowerStagePerson,
} from "@/features/reading-log/components/tower-view/tower-stage";
import { useReadingLogViewStore } from "@/features/reading-log/stores/use-reading-log-view-store";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils";

import type { AnnouncementProps } from "../../types";
import { FeatureCarousel, type FeatureSlide } from "../feature-carousel";

/** 작가가 도는 순서 */
const AUTHOR_ORDER: TowerAuthor[] = [
  "kafka",
  "sartre",
  "woolf",
  "camus",
  "kundera",
];
const AUTHOR_CYCLE_MS = 2600;
const STAGE = "h-full md:h-full";

type LabelsFor = (
  status: TowerStatus,
  userMm: number,
  authorName: string | null,
) => ReturnType<TowerStagePerson["labelsFor"]>;

/** 작가가 몇 초마다 바뀌며 같은 책탑 옆에 선다. 이름을 누르면 멈춘다 */
function AuthorCompare({
  books,
  towerMm,
  labelsFor,
  ariaLabel,
}: {
  books: ReadingTowerBook[];
  towerMm: number;
  labelsFor: LabelsFor;
  ariaLabel: string;
}) {
  const tt = useTranslations("reading_log.tower");
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(
      () => setI((v) => (v + 1) % AUTHOR_ORDER.length),
      AUTHOR_CYCLE_MS,
    );
    return () => clearInterval(id);
  }, [auto]);

  const author = AUTHOR_ORDER[i];
  const name = tt(`authors.${author}`);
  const person = useMemo<TowerStagePerson>(
    () => ({
      userMm: TOWER_AUTHORS[author].heightCm * 10,
      character: author,
      labelsFor: (s, mm) => labelsFor(s, mm, name),
    }),
    [author, name, labelsFor],
  );

  return (
    <>
      <div className="absolute left-3 top-2.5 z-[1] flex max-w-[calc(100%-56px)] flex-wrap gap-1">
        {AUTHOR_ORDER.map((id, k) => (
          <button
            key={id}
            type="button"
            aria-pressed={k === i}
            onClick={() => {
              setAuto(false);
              setI(k);
            }}
            className={cn(
              "cursor-pointer rounded-full border px-2 py-0.5 text-[11.5px] font-semibold",
              k === i
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-stone-200 bg-white text-stone-500",
            )}
          >
            {tt(`author_short.${id}`)}
          </button>
        ))}
      </div>
      <TowerStage
        books={books}
        towerMm={towerMm}
        person={person}
        replayKey={0}
        className={STAGE}
        towerClickLabel=""
        ariaLabel={ariaLabel}
      />
    </>
  );
}

/** 책탑 새 기능 소개. 로그인했고 올해 기록이 있으면 내 책탑, 아니면 예시 46권으로 보여 준다 */
export function ReadingTowerIntro({ open, onOpenChange }: AnnouncementProps) {
  const t = useTranslations("announcement.reading_tower");
  const { sceneLabels } = useTowerCopy();
  const { character, heightCm } = useTowerPerson();
  const loggedIn = useAuthStore((s) => Boolean(s.accessToken));
  const setViewMode = useReadingLogViewStore((s) => s.setViewMode);
  const router = useRouter();

  const { data } = useReadingTowerQuery(new Date().getFullYear(), {
    enabled: loggedIn && open,
  });
  const mine = data?.items.length ? data.items : null;
  const books = mine ?? SAMPLE_BOOKS;
  const towerMm = useMemo(
    () => books.reduce((a, b) => a + b.depth, 0),
    [books],
  );
  const avgDepthMm = towerMm / books.length;
  const stageLabel = t("stage_label", {
    count: books.length,
    height: cm1(towerMm),
  });

  const labelsFor = useCallback<LabelsFor>(
    (status, userMm, authorName) =>
      sceneLabels({ status, towerMm, userMm, avgDepthMm, authorName }),
    [sceneLabels, towerMm, avgDepthMm],
  );
  const me = useMemo<TowerStagePerson>(
    () => ({
      userMm: heightCm * 10,
      character,
      labelsFor: (s, mm) => labelsFor(s, mm, null),
    }),
    [heightCm, character, labelsFor],
  );

  const finish = () => {
    setViewMode("tower");
    if (!loggedIn) saveReturnUrl(PATHS.READING_LOG);
    onOpenChange(false);
    router.push(loggedIn ? PATHS.READING_LOG : PATHS.LOGIN);
  };

  const lastBook = books[books.length - 1];
  const slides: FeatureSlide[] = [
    {
      id: "stack",
      visual: (
        <TowerStage
          books={books}
          towerMm={towerMm}
          replayKey={0}
          className={STAGE}
          towerClickLabel=""
          ariaLabel={stageLabel}
        />
      ),
      title: mine ? t("s1_title_mine", { cm: cm1(towerMm) }) : t("s1_title"),
      body: t("s1_body"),
    },
    {
      id: "me",
      visual: (
        <TowerStage
          books={books}
          towerMm={towerMm}
          person={me}
          replayKey={0}
          className={STAGE}
          towerClickLabel=""
          ariaLabel={stageLabel}
        />
      ),
      title: t("s2_title"),
      body: t("s2_body"),
    },
    {
      id: "authors",
      visual: (
        <AuthorCompare
          books={books}
          towerMm={towerMm}
          labelsFor={labelsFor}
          ariaLabel={stageLabel}
        />
      ),
      title: t("s3_title"),
      body: t("s3_body"),
    },
    {
      id: "record",
      visual: (
        <>
          <TowerStage
            books={books}
            towerMm={towerMm}
            person={me}
            replayKey={0}
            className={STAGE}
            towerClickLabel=""
            ariaLabel={stageLabel}
          />
          {/* 「읽었어요」를 누르면 뜨는 알림 모형 */}
          <div
            aria-hidden="true"
            className="absolute bottom-10 left-1/2 w-max max-w-[calc(100%-32px)] -translate-x-1/2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-[13px] shadow-lg"
          >
            <b className="font-semibold text-stone-900">{t("toast_title")}</b>
            <span className="text-stone-500">
              {" "}
              · {t("toast_body", { cm: cm1(lastBook.depth) })}
            </span>
          </div>
        </>
      ),
      title: t("s4_title"),
      body: t("s4_body"),
    },
  ];

  return (
    <FeatureCarousel
      open={open}
      onOpenChange={onOpenChange}
      slides={slides}
      finalAction={
        <button
          type="button"
          onClick={finish}
          className="h-10 cursor-pointer rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          {loggedIn ? t("cta_view") : t("cta_join")}
        </button>
      }
    />
  );
}
