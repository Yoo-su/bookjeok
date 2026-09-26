"use client";

import { useReadingStackQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { saveReturnUrl } from "@/features/auth/utils/return-url";
import {
  cm1,
  useStackCopy,
} from "@/features/reading-log/components/stack-view/hooks/use-stack-copy";
import { useStackPerson } from "@/features/reading-log/components/stack-view/hooks/use-stack-person";
import { SAMPLE_BOOKS } from "@/features/reading-log/components/stack-view/lib/sample-books";
import {
  type CompareLabelsFor,
  StackCompareStage,
} from "@/features/reading-log/components/stack-view/stack-compare-stage";
import {
  StackStage,
  type StackStagePerson,
} from "@/features/reading-log/components/stack-view/stack-stage";
import { useReadingLogViewStore } from "@/features/reading-log/stores/use-reading-log-view-store";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import type { AnnouncementProps } from "../../types";
import { FeatureCarousel, type FeatureSlide } from "../feature-carousel";

const STAGE = "h-full md:h-full";

/** 독서 키재기 새 기능 소개. 로그인했고 올해 기록이 있으면 내가 쌓은 책, 아니면 예시 46권으로 보여 준다 */
export function ReadingStackIntro({ open, onOpenChange }: AnnouncementProps) {
  const t = useTranslations("announcement.reading_stack");
  const { sceneLabels } = useStackCopy();
  const { character, heightCm } = useStackPerson();
  const loggedIn = useAuthStore((s) => Boolean(s.accessToken));
  const setViewMode = useReadingLogViewStore((s) => s.setViewMode);
  const router = useRouter();

  const { data } = useReadingStackQuery(new Date().getFullYear(), {
    enabled: loggedIn && open,
  });
  const mine = data?.items.length ? data.items : null;
  const books = mine ?? SAMPLE_BOOKS;
  const stackMm = useMemo(
    () => books.reduce((a, b) => a + b.depth, 0),
    [books],
  );
  const avgDepthMm = stackMm / books.length;
  const stageLabel = t("stage_label", {
    count: books.length,
    height: cm1(stackMm),
  });

  const labelsFor = useCallback<CompareLabelsFor>(
    (status, userMm, authorName) =>
      sceneLabels({ status, stackMm, userMm, avgDepthMm, authorName }),
    [sceneLabels, stackMm, avgDepthMm],
  );
  const me = useMemo<StackStagePerson>(
    () => ({
      userMm: heightCm * 10,
      character,
      labelsFor: (s, mm) => labelsFor(s, mm, null),
    }),
    [heightCm, character, labelsFor],
  );

  const finish = () => {
    setViewMode("stack");
    if (!loggedIn) saveReturnUrl(PATHS.READING_LOG);
    onOpenChange(false);
    router.push(loggedIn ? PATHS.READING_LOG : PATHS.LOGIN);
  };

  const lastBook = books[books.length - 1];
  const slides: FeatureSlide[] = [
    {
      id: "stack",
      visual: (
        <StackStage
          books={books}
          stackMm={stackMm}
          replayKey={0}
          className={STAGE}
          stackClickLabel=""
          ariaLabel={stageLabel}
        />
      ),
      title: mine ? t("s1_title_mine", { cm: cm1(stackMm) }) : t("s1_title"),
      body: t("s1_body"),
    },
    {
      id: "me",
      visual: (
        <StackStage
          books={books}
          stackMm={stackMm}
          person={me}
          replayKey={0}
          className={STAGE}
          stackClickLabel=""
          ariaLabel={stageLabel}
        />
      ),
      title: t("s2_title"),
      body: t("s2_body"),
    },
    {
      id: "authors",
      visual: (
        <StackCompareStage
          books={books}
          stackMm={stackMm}
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
          <StackStage
            books={books}
            stackMm={stackMm}
            person={me}
            replayKey={0}
            className={STAGE}
            stackClickLabel=""
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
