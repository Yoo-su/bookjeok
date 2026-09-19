"use client";

import type { LoungeBookCard } from "@bookjeok/core";
import { useTranslations } from "next-intl";

import { LoungeActiveReaders } from "@/features/reading-log/components/lounge-feed/lounge-active-readers";
import { LoungeBookDetailModal } from "@/features/reading-log/components/lounge-feed/lounge-book-detail-modal";
import { LoungeFeedList } from "@/features/reading-log/components/lounge-feed/lounge-feed-list";
import { LoungePopularBanner } from "@/features/reading-log/components/lounge-feed/lounge-popular-banner";
import { AdBanner } from "@/shared/components/ads/ad-banner";
import { CrowdCanvas } from "@/shared/components/skiperui/canvas-crowd";
import { useOverlay } from "@/shared/hooks/use-overlay";

export function LoungeView() {
  const t = useTranslations("lounge.metadata");
  const overlay = useOverlay();

  const handleOpenModal = (
    isbn: string,
    book?: LoungeBookCard["book"],
    totalCount?: number,
  ) => {
    overlay.open(({ isOpen, close }) => (
      <LoungeBookDetailModal
        isbn={isbn}
        initialBook={book || null}
        initialTotalCount={totalCount || 0}
        isOpen={isOpen}
        onClose={close}
      />
    ));
  };

  return (
    <div className="min-h-screen relative">
      {/* Skiper UI CrowdCanvas 히어로 영역 */}
      <div className="relative w-full h-[60vh] min-h-[400px] mb-12 md:mb-16">
        <CrowdCanvas
          src="/images/peeps/all-peeps.png"
          rows={15}
          cols={7}
          className="absolute bottom-0 h-full w-full"
        />
      </div>

      <div className="w-full mx-auto px-4">
        <header className="mb-12">
          <h1 className="font-serif text-3xl sm:text-4xl font-medium">
            {t("title")}
          </h1>
          <p className="mt-3 text-stone-500">{t("description")}</p>
        </header>
        {/* 콘텐츠 영역 */}
        <div className="space-y-16 md:space-y-24">
          {/* 열성 독서가 명예의 전당 */}
          <LoungeActiveReaders />

          {/* 인기 도서 배너 */}
          <LoungePopularBanner onCardClick={handleOpenModal} />

          {/* 광고 배너 (섹션 분기 영역) */}
          <div className="py-2">
            <AdBanner
              dataAdSlot="6040704861"
              dataAdFormat="horizontal"
              className="w-full"
            />
          </div>

          {/* 최신 활동 피드 */}
          <LoungeFeedList onCardClick={handleOpenModal} />
        </div>
      </div>
    </div>
  );
}
