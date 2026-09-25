import { getPopularKeywords } from "@bookjeok/api-client";
import { bookKeys } from "@bookjeok/core";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { SearchHero } from "@/features/book/components/book-search/search-hero";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import BookSearchView from "@/views/book-search-view";

// 방문자는 마운트 시 refetch로 최신을 받는다. HTML은 크롤러·첫 화면용이라 길게 둔다
export const revalidate = 21600; // 6시간

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "book.search.metadata",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/book/search",
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // 인기 검색어 프리패치 (5분 캐싱)
  const queries = [
    {
      queryKey: bookKeys.popularKeywords.queryKey,
      queryFn: () => getPopularKeywords(),
    },
  ];

  return (
    <ServerQueryBoundary queries={queries}>
      {/*
        히어로는 URL 파라미터와 무관하므로 Suspense 밖에서 서버 렌더링합니다.
        검색 결과 목록은 ?q= 값에 전적으로 의존하므로(그리고 검색 결과 페이지는
        색인 대상이 아니므로) 아래 경계 안에서 클라이언트 렌더링으로 남겨둡니다.
      */}
      <SearchHero />

      <Suspense fallback={null}>
        <BookSearchView />
      </Suspense>
    </ServerQueryBoundary>
  );
}
