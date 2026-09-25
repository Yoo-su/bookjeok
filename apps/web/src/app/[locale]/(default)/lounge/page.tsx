import {
  getLoungeActiveReaders,
  getLoungeFeed,
  getLoungePopular,
} from "@bookjeok/api-client";
import { readingLogKeys } from "@bookjeok/core";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BreadcrumbJsonLd } from "@/shared/components/breadcrumb-json-ld";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { LoungeView } from "@/views/lounge-view";

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
  const t = await getTranslations({ locale, namespace: "lounge.metadata" });
  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/lounge",
  });
}

export default async function LoungePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "header" });

  const breadcrumbs = [
    { name: locale === "ko" ? "홈" : "Home", url: `/${locale}` },
    { name: t("nav.menu_lounge"), url: `/${locale}/lounge` },
  ];

  const queries = [
    {
      type: "infinite" as const,
      required: true,
      queryKey: readingLogKeys.loungeFeed.queryKey,
      queryFn: ({ pageParam }: { pageParam?: string | null }) =>
        getLoungeFeed(pageParam ?? null),
      initialPageParam: null,
    },
    {
      queryKey: readingLogKeys.loungePopular.queryKey,
      queryFn: getLoungePopular,
    },
    {
      queryKey: readingLogKeys.loungeActiveReaders.queryKey,
      queryFn: getLoungeActiveReaders,
    },
  ];

  return (
    <ServerQueryBoundary queries={queries}>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <LoungeView />
    </ServerQueryBoundary>
  );
}
