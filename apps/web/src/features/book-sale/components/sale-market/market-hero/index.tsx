"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { useMarketHeroStats } from "@/features/book-sale/hooks/use-market-hero-stats";
import { GravityStarsBackground } from "@/shared/components/animateui/gravity-stars";
import { ArrowUpRight } from "@/shared/components/icons/iconsax";
import { AvatarCircles } from "@/shared/components/magicui/avatar-circles";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

import { LiveListingFeed } from "./live-listing-feed";

export const MarketHero = () => {
  const t = useTranslations("market.hero");
  const prefersReducedMotion = usePrefersReducedMotion();

  const {
    sales,
    isLoading,
    freshCount,
    newTodayLabel,
    regionCount,
    sellers,
    hasStats,
  } = useMarketHeroStats();

  return (
    <section className="relative -mx-4 mb-10 overflow-hidden bg-[#0A0A0A] sm:-mx-6 md:mb-14">
      {/* 배경 레이어 (장식용) */}
      <div aria-hidden className="absolute inset-0">
        {!prefersReducedMotion && (
          <GravityStarsBackground
            className="absolute inset-0 text-white"
            starsCount={90}
            starsSize={1.5}
            starsOpacity={1}
            glowIntensity={8}
            movementSpeed={0.16}
            mouseInfluence={150}
            mouseGravity="attract"
            gravityStrength={55}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(72%_58%_at_84%_0%,rgba(255,255,255,0.09),transparent_62%),radial-gradient(62%_62%_at_0%_100%,rgba(255,255,255,0.05),transparent_62%)]" />
      </div>

      {/*
        본문은 pointer-events-none으로 두어 마우스 이동이 배경 캔버스까지 전달되게 하고,
        실제로 눌러야 하는 요소에만 pointer-events-auto를 다시 켠다.
      */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none relative z-10 grid gap-9 px-6 py-12 sm:px-9 sm:py-14 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-center md:gap-12 md:px-12 md:py-16"
      >
        <div>
          <h1 className="break-keep font-(family-name:--font-gowun-batang) text-[1.9rem] leading-[1.28] sm:text-[2.4rem] md:text-[2.85rem]">
            <span className="block text-neutral-500">{t("title_lead")}</span>
            <span className="block text-neutral-50">{t("title_main")}</span>
          </h1>

          <p className="mt-6 max-w-md whitespace-pre-line break-keep text-[13.5px] leading-relaxed text-neutral-400 sm:text-[15px]">
            {t("description")}
          </p>

          <Link
            href={PATHS.BOOK_SALES_REGISTER}
            className="pointer-events-auto group mt-8 inline-flex items-center gap-2.5 bg-white px-6 py-3.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
          >
            {t("cta_sell")}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>

          {/*
            실데이터 기반 지표. 값이 0인 항목은 렌더링하지 않는다.
            판매글이 없는 초기 서비스에서 "0"을 크게 노출하면 비어 있다는 인상만 남는다.
          */}
          {hasStats && (
            <div className="mt-10 flex flex-wrap items-end gap-x-7 gap-y-5 border-t border-white/10 pt-6 sm:gap-x-9">
              {freshCount > 0 && (
                <StatCell
                  value={newTodayLabel}
                  label={t("stats.new_listings")}
                />
              )}
              {regionCount > 0 && (
                <StatCell
                  value={String(regionCount)}
                  label={t("stats.regions")}
                />
              )}
              {sellers.length > 0 && (
                <div>
                  <div className="flex h-[26px] items-center">
                    <AvatarCircles
                      avatars={sellers.slice(0, 4)}
                      extraCount={Math.max(0, sellers.length - 4)}
                      size="sm"
                      className="[&>div]:h-6 [&>div]:w-6 [&>div]:border-[#0A0A0A]"
                    />
                  </div>
                  <span className="mt-2.5 block text-[11px] tracking-tight text-neutral-500">
                    {t("stats.sellers")}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <LiveListingFeed
          sales={sales}
          isLoading={isLoading}
          paused={prefersReducedMotion}
        />
      </motion.div>
    </section>
  );
};

const StatCell = ({ value, label }: { value: string; label: string }) => (
  <div>
    <span className="block font-(family-name:--font-gowun-batang) text-2xl leading-none tabular-nums text-neutral-50 sm:text-[26px]">
      {value}
    </span>
    <span className="mt-2.5 block text-[11px] tracking-tight text-neutral-500">
      {label}
    </span>
  </div>
);
