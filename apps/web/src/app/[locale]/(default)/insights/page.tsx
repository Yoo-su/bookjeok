import { getInsights } from "@bookjeok/api-client";
import { insightsKeys } from "@bookjeok/core";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BreadcrumbJsonLd } from "@/shared/components/breadcrumb-json-ld";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import InsightsView from "@/views/insights-view";

// 6시간마다 데이터 재검증
export const revalidate = 21600;

/** 메뉴에서 내린 페이지. 코드는 두고 주소로 들어와도 404를 낸다 */
const INSIGHTS_OPEN = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "insights.metadata" });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/insights",
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!INSIGHTS_OPEN) notFound();

  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "header" });

  const breadcrumbs = [
    { name: locale === "ko" ? "홈" : "Home", url: `/${locale}` },
    { name: t("nav.menu_insights"), url: `/${locale}/insights` },
  ];

  return (
    <ServerQueryBoundary
      queries={[{ queryKey: insightsKeys.all.queryKey, queryFn: getInsights }]}
    >
      <BreadcrumbJsonLd items={breadcrumbs} />
      <InsightsView />
    </ServerQueryBoundary>
  );
}
