"use client";

import { useReadingStackQuery } from "@bookjeok/react-query";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { ArrowRight } from "@/shared/components/icons/iconsax";
import { DockPanel } from "@/shared/components/ui/dock-panel";
import { Link, useRouter } from "@/shared/config/i18n/routing";

import { useStackSettingsStore } from "../../../stores/use-stack-settings-store";
import { readingLogHref } from "../../../utils/reading-log-link";
import { useStackComparison } from "../../stack-view/hooks/use-stack-comparison";
import { cm1, useStackCopy } from "../../stack-view/hooks/use-stack-copy";
import { BODY_PARTS, stackStatus } from "../../stack-view/lib/status";
import { StackObjectProgress } from "../../stack-view/stack-object-progress";
import { StackProgress } from "../../stack-view/stack-progress";
import { StackStage } from "../../stack-view/stack-stage";

interface ReadingStackPanelProps {
  open: boolean;
  onClose: () => void;
}

/** 페이지와 같은 기준. 쌓은 책이 무릎 아래면 사물과 비교 */
const OBJECT_FIRST_RATIO =
  BODY_PARTS.find((p) => p.key === "knee")?.ratio ?? 0.28;
/** 한 줄에 작게. 무대에 이미 책이 그려져 있어 표지는 곁들이는 정도 */
const RECENT_COVERS = 6;

/** 독서 키재기 미리보기. 보기 전용이며 무대·공유는 페이지에서 */
export const ReadingStackPanel = ({
  open,
  onClose,
}: ReadingStackPanelProps) => {
  const t = useTranslations("reading_log.peek");
  const tStack = useTranslations("reading_log.stack");
  const { lede, objectLede } = useStackCopy();
  const { heightCm, author } = useStackComparison();
  const savedMode = useStackSettingsStore((s) => s.compareMode);
  const year = new Date().getFullYear();

  const router = useRouter();
  const { data, isLoading } = useReadingStackQuery(year, { enabled: open });
  // 열 때마다 책을 다시 떨어뜨림. 페이지에 들어갈 때와 같은 첫인상
  const [replayKey, setReplayKey] = useState(0);
  useEffect(() => {
    if (open) setReplayKey((k) => k + 1);
  }, [open]);
  const books = useMemo(() => data?.items ?? [], [data]);
  const totals = useMemo(() => {
    const stackMm = books.reduce((a, b) => a + b.depth, 0);
    return {
      stackMm,
      pages: books.reduce((a, b) => a + (b.pages ?? 0), 0),
      grams: books.reduce((a, b) => a + b.weight, 0),
      avgDepthMm: books.length ? stackMm / books.length : 20,
    };
  }, [books]);

  const userMm = heightCm * 10;
  const status = stackStatus(totals.stackMm, userMm);
  const mode =
    savedMode ?? (status.ratio < OBJECT_FIRST_RATIO ? "object" : "person");
  const hasBooks = books.length > 0;
  const recent = books.slice(-RECENT_COVERS).reverse();

  return (
    <DockPanel
      open={open}
      onClose={onClose}
      label={t("stack_title")}
      dismissOnOutsideClick
      desktopClassName="w-[min(26rem,calc(100vw-2rem))]"
      mobileClassName=""
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="grid min-h-0 gap-4 overflow-y-auto px-5 pb-4 pt-1 group-data-[layout=card]/dock-panel:pt-5">
          <header className="grid gap-1.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">
              {year} · {t("stack_title")}
            </p>
            {isLoading ? (
              <div className="h-9 w-40 animate-pulse rounded-md bg-stone-100" />
            ) : hasBooks ? (
              <h2 className="font-serif text-[34px] font-semibold leading-none tracking-tight text-stone-900">
                <span className="tabular-nums">{books.length}</span>
                <span className="text-[0.5em] text-stone-500">
                  {tStack("count_unit", { count: books.length })}
                </span>
                , <span className="tabular-nums">{cm1(totals.stackMm)}</span>
                <span className="text-[0.5em] text-stone-500">
                  {tStack("height_unit")}
                </span>
              </h2>
            ) : (
              <h2 className="text-lg font-bold text-stone-900">
                {tStack("empty_title", { year })}
              </h2>
            )}
            {!isLoading && (
              <p className="text-sm leading-relaxed text-stone-500">
                {hasBooks
                  ? mode === "object"
                    ? objectLede({
                        stackMm: totals.stackMm,
                        year,
                        hasBooks,
                      })
                    : lede({
                        status,
                        stackMm: totals.stackMm,
                        userMm,
                        year,
                        hasBooks,
                      })
                  : t("stack_empty")}
              </p>
            )}
          </header>

          {/* 글과 그림 사이를 가르는 아주 옅은 선 */}
          {hasBooks && <hr className="border-stone-100" />}

          {hasBooks && (
            // 360px 미만은 진행률 카드가 너무 좁아져 무대를 위로 올림
            <div className="grid items-end gap-3 min-[360px]:grid-cols-[6.5rem_minmax(0,1fr)]">
              {/* 페이지·공개 프로필과 같은 연필 무대. 사람·사물 없이 쌓은 책만 */}
              <StackStage
                books={books}
                stackMm={totals.stackMm}
                className="h-[240px] md:h-[240px]"
                // 무대가 작아 다독이면 책이 바늘처럼 가늘어짐. 높이는 그대로, 폭만 유지
                minStackWidthPx={30}
                replayKey={replayKey}
                onStackClick={() => {
                  onClose();
                  router.push(readingLogHref({ view: "stack" }));
                }}
                stackClickLabel={t("open_stack")}
                ariaLabel={t("stage_label", {
                  year,
                  count: books.length,
                  height: cm1(totals.stackMm),
                })}
              />
              {mode === "object" ? (
                <StackObjectProgress
                  stackMm={totals.stackMm}
                  avgDepthMm={totals.avgDepthMm}
                  count={books.length}
                  pages={totals.pages}
                  grams={totals.grams}
                />
              ) : (
                <StackProgress
                  comparisonName={
                    author ? tStack(`authors.${author}`) : undefined
                  }
                  status={status}
                  stackMm={totals.stackMm}
                  userMm={userMm}
                  avgDepthMm={totals.avgDepthMm}
                  count={books.length}
                  pages={totals.pages}
                  grams={totals.grams}
                />
              )}
            </div>
          )}

          {recent.length > 0 && (
            <section className="grid gap-2">
              <h3 className="text-xs font-semibold text-stone-500">
                {t("recent_books")}
              </h3>
              <div className="grid grid-cols-6 gap-1.5">
                {recent.map((b) => (
                  <div
                    key={b.logId}
                    title={b.title}
                    className="relative aspect-[2/3] overflow-hidden rounded-[5px] bg-stone-100 shadow-sm ring-1 ring-black/5"
                  >
                    <Image
                      src={b.image}
                      alt={b.title}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <footer className="shrink-0 border-t border-stone-100 px-3 py-2">
          <Link
            href={readingLogHref({ view: "stack" })}
            onClick={onClose}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900"
          >
            {t("open_stack")}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </DockPanel>
  );
};
