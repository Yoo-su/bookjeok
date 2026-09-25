import {
  getAvailableRegions,
  getBookSales,
  getPopularBookSales,
  getRecentBookSales,
} from "@bookjeok/api-client";
import { bookSaleKeys } from "@bookjeok/core";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BreadcrumbJsonLd } from "@/shared/components/breadcrumb-json-ld";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { BookMarketView } from "@/views/book-market-view";

// 방문자는 마운트 시 refetch로 최신을 받는다. HTML은 크롤러·첫 화면용이라 길게 둔다
export const revalidate = 21600; // 6시간

// API 서버에 의존하는 목록은 첫 방문에 생성한 뒤 ISR로 유지한다.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "market.hero.metadata",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/book/market",
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "header" });

  const breadcrumbs = [
    { name: locale === "ko" ? "홈" : "Home", url: `/${locale}` },
    { name: t("nav.menu_market"), url: `/${locale}/book/market` },
  ];

  /** useMarketHeroStats의 RECENT_LIMIT과 같아야 캐시가 맞는다. */
  const HERO_RECENT_LIMIT = 25;

  const queries = [
    {
      queryKey: bookSaleKeys.popularSales.queryKey,
      queryFn: getPopularBookSales,
    },
    /*
      히어로 지표(useMarketHeroStats)용. 이 두 쿼리가 캐시에 없으면 인트로를 건너뛴
      방문자에게 지표 행이 리빌 뒤에 나타나며 CTA를 아래로 밀어낸다.
    */
    {
      queryKey: bookSaleKeys.recentSales(HERO_RECENT_LIMIT).queryKey,
      queryFn: () => getRecentBookSales(HERO_RECENT_LIMIT),
    },
    {
      queryKey: bookSaleKeys.availableRegions.queryKey,
      queryFn: getAvailableRegions,
    },
    {
      type: "infinite" as const,
      required: true,
      queryKey: bookSaleKeys.marketSales({}).queryKey,
      queryFn: ({ pageParam }: { pageParam?: string }) =>
        getBookSales({
          page: 1,
          cursor: pageParam,
        }),
      initialPageParam: undefined,
    },
  ];

  return (
    <ServerQueryBoundary queries={queries}>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <BookMarketView />
    </ServerQueryBoundary>
  );
}
