"use client";

import {
  inkColorFor,
  type LoungeMountainBook,
  type LoungeMountainResponse,
  MOUNTAIN_LANDMARKS,
  type MountainLandmarkId,
  nextMountainLandmark,
} from "@bookjeok/core";
import {
  useLoungeMountainQuery,
  useMyMountainShareQuery,
} from "@bookjeok/react-query";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { formatRelativeTime } from "@/shared/utils/format-date";

import { ReadingLogStartLink } from "../../common/reading-log-start-link";
import { bookColor } from "../../stack-view/lib/scene";
import { hashSeed, rng } from "../../stack-view/lib/sketch";
import { SketchBook } from "../../stack-view/stack-order-list";
import type { MountainStageScene } from "./mountain-stage";

const MountainStage = dynamic(() => import("./mountain-stage"), {
  ssr: false,
  loading: () => <Skeleton className="h-[240px] w-full rounded-xl" />,
});

/** 막 올라온 책 목록의 축척(px/mm). 두께는 제목이 읽히게 과장한다 */
const PEAK_SCALE = { width: 0.86, depth: 1.25, minDepthPx: 16 };

type LandmarkCopy = { name: string; object: string };

function useMountainCopy() {
  const t = useTranslations("lounge.mountain");
  const len = useCallback(
    (mm: number) =>
      mm >= 1e6
        ? t("len_km", { v: Number((mm / 1e6).toFixed(2)) })
        : mm >= 1000
          ? t("len_m", { v: Number((mm / 1000).toFixed(2)) })
          : t("len_cm", { v: Number((mm / 10).toFixed(1)) }),
    [t],
  );
  const landmark = useCallback(
    (id: MountainLandmarkId): LandmarkCopy => ({
      name: t(`landmarks.${id}.name`),
      object: t(`landmarks.${id}.object`),
    }),
    [t],
  );
  return { t, len, landmark };
}

/** 넘은 날. 서버(UTC)와 브라우저가 같은 글자를 내도록 한국 시간으로 고정한다 */
function reachedDay(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });
}

interface LoungeMountainProps {
  onBookClick?: (isbn: string) => void;
}

/**
 * 북적 책동산. 공개 독서 기록 전체를 한 산으로 쌓아 높이·다음 이정표·막 올라온 책·지나온 이정표를 보여 준다.
 * 숫자와 목록은 서버 HTML에 들어가고, 무대(SVG)는 폭을 잰 뒤 브라우저에서 그린다.
 */
export function LoungeMountain({ onBookClick }: LoungeMountainProps) {
  const { t, len, landmark } = useMountainCopy();
  const locale = useLocale();
  const { data: seed, isLoading } = useLoungeMountainQuery();
  // SSR 시드가 형태가 어긋난 200이면 이 섹션만 생략한다. 훅에서 쓰기 전에 검사한다.
  const data =
    seed &&
    Array.isArray(seed.bands) &&
    Array.isArray(seed.peak) &&
    Array.isArray(seed.milestones)
      ? seed
      : null;

  const scene = useMemo(
    () => (data?.bookCount ? toScene(data, { t, len, landmark }) : null),
    [data, t, len, landmark],
  );

  if (isLoading) {
    return (
      <section>
        <div className="mb-8">
          <Skeleton className="mb-3 h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </section>
    );
  }
  // 다른 라운지 섹션처럼 형태가 어긋난 응답·빈 책동산은 섹션 부재로 흡수한다
  if (!data?.bookCount || !scene) return null;

  const milestones = [...(data.milestones ?? [])].reverse();

  return (
    <section>
      <div className="mb-6 border-b border-stone-200 pb-5">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-stone-900 sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mt-2 text-sm font-light text-stone-500 sm:text-base">
          {t("subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
        <p className="font-[family-name:var(--font-gaegu)] text-5xl font-bold leading-none text-stone-900">
          {len(data.totalMm)}
        </p>
        <p className="pb-1 text-sm text-stone-500">
          {t("stats", { count: data.bookCount, readers: data.readerCount })}
        </p>
        <p className="pb-1 text-sm font-semibold text-emerald-700">
          {data.weekCount > 0
            ? t("week", { height: len(data.weekMm), count: data.weekCount })
            : t("week_quiet")}
        </p>
      </div>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <MountainStage scene={scene.stage} ariaLabel={scene.ariaLabel} />

        {/* 넓은 화면에서는 무대 바닥선(PAD.floor 30px)에 발을 맞춘다 */}
        <div className="lg:pb-[30px]">
          <h3 className="font-serif text-lg font-semibold tracking-tight text-stone-900">
            {t("peak_title")}
          </h3>
          <p className="mt-1 text-[13px] text-stone-500">{t("peak_hint")}</p>
          <ol className="mt-4 flex flex-col gap-px">
            {data.peak.map((b) => (
              <PeakRow
                key={b.logId}
                book={b}
                locale={locale}
                onClick={onBookClick}
              />
            ))}
          </ol>
          <div className="mt-5 lg:mt-6">
            <MyShare len={len} />
            <ReadingLogStartLink
              view="calendar"
              className="border border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50 w-full"
            >
              {t("cta")}
            </ReadingLogStartLink>
          </div>
        </div>
      </div>

      {milestones.length > 0 && (
        <div className="mt-8">
          <h3 className="font-serif text-lg font-semibold tracking-tight text-stone-900">
            {t("milestones_title")}
          </h3>
          <ul className="mt-3 divide-y divide-stone-100 border-y border-stone-100">
            {milestones.map((m) => (
              <li
                key={m.landmark}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2.5 text-sm"
              >
                <span className="font-semibold text-stone-900">
                  {landmark(m.landmark).name}
                </span>
                <span className="text-stone-400">
                  {reachedDay(m.reachedAt, locale)}
                </span>
                <span className="min-w-0 text-stone-500">
                  {t.rich("milestone_by", {
                    title: m.title,
                    user: (chunks) =>
                      m.reader.handle ? (
                        <Link
                          href={PATHS.USER_PROFILE(m.reader.handle)}
                          prefetch={false}
                          className="-my-2 inline-block py-2 font-medium text-stone-700 hover:underline"
                        >
                          {chunks}
                        </Link>
                      ) : (
                        chunks
                      ),
                    nickname: m.reader.nickname,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** 책동산에서 내 몫. 비로그인이거나 산에 내 책이 없으면(비공개 설정 포함) 그리지 않는다 */
function MyShare({ len }: { len: (mm: number) => string }) {
  const t = useTranslations("lounge.mountain");
  const user = useAuthStore((s) => s.user);
  const { data } = useMyMountainShareQuery({ enabled: !!user });
  if (!user || !data?.myCount || !data.totalMm) return null;
  const pct = (data.myMm / data.totalMm) * 100;
  return (
    <p className="mb-3 flex flex-wrap items-baseline gap-x-1.5 text-sm text-stone-500">
      {t.rich("my_share", {
        height: len(data.myMm),
        h: (chunks) => (
          <strong className="font-[family-name:var(--font-gaegu)] text-2xl font-bold leading-none text-stone-900">
            {chunks}
          </strong>
        ),
      })}
      <span>
        {"· "}
        {pct < 0.1
          ? t("my_share_tiny")
          : t("my_share_pct", { v: Number(pct.toFixed(1)) })}
      </span>
    </p>
  );
}

function PeakRow({
  book: b,
  locale,
  onClick,
}: {
  book: LoungeMountainBook;
  locale: string;
  onClick?: (isbn: string) => void;
}) {
  const seed = hashSeed(`${b.isbn}:${b.logId}`);
  const r = rng(seed);
  const jx = (r() - 0.5) * 14;
  const jr = (r() - 0.5) * 1.2;
  const w = Math.min(210, b.height * PEAK_SCALE.width);
  const h = Math.max(PEAK_SCALE.minDepthPx, b.depth * PEAK_SCALE.depth);
  const color = bookColor(b);
  const fs = Math.max(11, Math.min(17, h * 0.6));
  return (
    <li className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onClick?.(b.isbn)}
        aria-label={b.title}
        className="relative isolate flex shrink-0 cursor-pointer items-center rounded-[2px] px-3 text-left font-[family-name:var(--font-gaegu)] font-bold transition-transform duration-200 [transform:translateX(var(--jx))_rotate(var(--jr))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 pointer-fine:hover:[transform:translateX(calc(var(--jx)+8px))]"
        style={
          {
            color: inkColorFor(color),
            width: `${w.toFixed(1)}px`,
            height: `${h.toFixed(1)}px`,
            "--jx": `${jx.toFixed(1)}px`,
            "--jr": `${jr.toFixed(2)}deg`,
          } as React.CSSProperties
        }
      >
        <SketchBook w={w} h={h} color={color} seed={seed} />
        <span
          className="min-w-0 flex-1 truncate leading-none"
          style={{ fontSize: `${fs.toFixed(1)}px` }}
        >
          {b.title}
        </span>
      </button>
      <span className="min-w-0 truncate text-xs text-stone-500">
        {b.reader.handle ? (
          <Link
            href={PATHS.USER_PROFILE(b.reader.handle)}
            prefetch={false}
            className="-my-2 inline-block py-2 font-medium text-stone-700 hover:underline"
          >
            {b.reader.nickname}
          </Link>
        ) : (
          b.reader.nickname
        )}
        {" · "}
        {/* ISR HTML은 몇 시간 묵으므로 상대 시각은 브라우저 값이 이긴다 */}
        <time dateTime={b.addedAt} suppressHydrationWarning>
          {formatRelativeTime(b.addedAt, locale)}
        </time>
      </span>
    </li>
  );
}

function toScene(
  data: LoungeMountainResponse,
  copy: ReturnType<typeof useMountainCopy>,
): { stage: MountainStageScene; ariaLabel: string } {
  const { t, len, landmark } = copy;
  const total = data.totalMm;
  const next = nextMountainLandmark(total);
  const target = next ?? MOUNTAIN_LANDMARKS[MOUNTAIN_LANDMARKS.length - 1];
  const passed = MOUNTAIN_LANDMARKS.filter((l) => l.heightMm <= total);
  const remainMm = Math.max(0, target.heightMm - total);
  const perBook = total / data.bookCount;
  const name = landmark(target.id);
  const latest = data.peak[0];
  return {
    ariaLabel: t("stage_label", {
      height: len(total),
      name: name.name,
      remain: len(remainMm),
    }),
    stage: {
      bands: data.bands,
      totalMm: total,
      weekMm: data.weekMm,
      target,
      passed,
      heldColor: latest ? bookColor(latest) : "#E7E5E4",
      labels: {
        total: len(total),
        target: t("target", {
          name: name.name,
          height: len(target.heightMm),
        }),
        remain: t("remain", { height: len(remainMm) }),
        approxBooks: t("approx_books", {
          count: Math.ceil(remainMm / Math.max(1, perBook)),
        }),
        week: `+${len(data.weekMm)}`,
        weekSub: t("week_label"),
        bubble: next
          ? [
              t("bubble_remain", { height: len(remainMm) }),
              t("bubble_goal", { object: name.object }),
            ]
          : [t("bubble_done"), t("bubble_done_sub")],
        flags: Object.fromEntries(
          passed.map((l) => [l.id, landmark(l.id).name]),
        ),
      },
    },
  };
}
