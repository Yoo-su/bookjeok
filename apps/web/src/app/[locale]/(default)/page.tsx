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
import { HOME_PUBLISHER_BOOKS_DISPLAY } from "@/features/book/constants/queries";
import { RECENT_SALES_LIMIT } from "@/features/book-sale/constants/queries";
import { REVIEW_TICKER_POOL_SIZE } from "@/features/review/constants/queries";
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
      queryKey: bookSaleKeys.recentSales(RECENT_SALES_LIMIT).queryKey,
      queryFn: () => getRecentBookSales(RECENT_SALES_LIMIT),
    },
    {
      queryKey: bookKeys.popularBooks.queryKey,
      queryFn: () => getPopularBooks(),
    },
    {
      // 최신 리뷰 티커가 순환시킬 풀. 화면에는 5건만 보인다
      queryKey: reviewKeys.list({ page: 1, limit: REVIEW_TICKER_POOL_SIZE })
        .queryKey,
      queryFn: () => getReviews({ page: 1, limit: REVIEW_TICKER_POOL_SIZE }),
    },
    {
      queryKey: bookKeys.list({
        query: HOME_PUBLISHERS[0],
        display: HOME_PUBLISHER_BOOKS_DISPLAY,
      }).queryKey,
      queryFn: () =>
        getPublisherBooksServer(
          HOME_PUBLISHERS[0],
          HOME_PUBLISHER_BOOKS_DISPLAY,
        ),
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
