import {
  getLoungePopular,
  getPopularBooks,
  getRecentBookSales,
  getReviews,
} from "@bookjeok/api-client";
import {
  bookKeys,
  bookSaleKeys,
  HOME_PUBLISHERS,
  readingLogKeys,
  reviewKeys,
} from "@bookjeok/core";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getPublisherBooksServer } from "@/features/book/apis/server";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { HomeView } from "@/views/home-view";

// 방문자는 마운트 시 refetch로 최신을 받는다. HTML은 크롤러·첫 화면용이라 길게 둔다
export const revalidate = 21600; // 6시간

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return createPageMetadata({
    title: t("default_title"),
    description: t("description"),
    locale,
    path: "",
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const queries = [
    {
      queryKey: bookSaleKeys.recentSales(25).queryKey,
      queryFn: () => getRecentBookSales(25),
    },
    {
      queryKey: bookKeys.popularBooks.queryKey,
      queryFn: () => getPopularBooks(),
    },
    {
      // 최신 리뷰 티커가 순환시킬 풀. 화면에는 5건만 보인다.
      // `features/review/components/recent-review-list`의 TICKER_POOL_SIZE와
      // 같아야 한다 — 어긋나면 키가 달라져 이 시드가 버려진다
      queryKey: reviewKeys.list({ page: 1, limit: 20 }).queryKey,
      queryFn: () => getReviews({ page: 1, limit: 20 }),
    },
    {
      queryKey: bookKeys.list({
        query: HOME_PUBLISHERS[0],
        display: 18,
      }).queryKey,
      queryFn: () => getPublisherBooksServer(HOME_PUBLISHERS[0], 18),
    },
    {
      queryKey: readingLogKeys.loungePopular.queryKey,
      queryFn: getLoungePopular,
    },
  ];

  return (
    <ServerQueryBoundary queries={queries}>
      <HomeView />
    </ServerQueryBoundary>
  );
}
