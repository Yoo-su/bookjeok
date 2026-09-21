import { getPopularReviews, getReviewFeeds } from "@bookjeok/api-client";
import { reviewKeys } from "@bookjeok/core";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ReviewHomeHero } from "@/features/review/components/review-home-hero";
import { pickHeroImage } from "@/features/review/components/review-home-hero/hero-images";
import { BreadcrumbJsonLd } from "@/shared/components/breadcrumb-json-ld";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { ReviewHomeView } from "@/views/review-home-view";
import { ReviewHomeViewWithParams } from "@/views/review-home-view/with-params";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "review.metadata" });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/book/reviews",
  });
}

export const revalidate = 3600;

// API 서버에 의존하는 목록은 첫 방문에 생성한 뒤 ISR로 유지한다.
export function generateStaticParams() {
  return [];
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
    { name: t("nav.menu_reviews"), url: `/${locale}/book/reviews` },
  ];

  const queries = [
    { queryKey: reviewKeys.popular.queryKey, queryFn: getPopularReviews },
    {
      required: true,
      queryKey: reviewKeys.feeds().queryKey,
      queryFn: getReviewFeeds,
    },
  ];

  return (
    <ServerQueryBoundary queries={queries}>
      <BreadcrumbJsonLd items={breadcrumbs} />

      {/* 히어로는 URL 파라미터와 무관하므로 Suspense 밖에서 서버 렌더링합니다. */}
      <ReviewHomeHero imageSrc={pickHeroImage()} />

      {/*
        useSearchParams는 정적 렌더링 라우트에서 가장 가까운 Suspense 경계까지
        서버 렌더링을 건너뛰게 만듭니다. 그래서 URL을 읽는 래퍼만 경계 안에 두고,
        fallback으로는 스켈레톤 대신 "필터가 걸리지 않은 기본 화면"을 넘깁니다.
        fallback은 서버에서 렌더링되므로, 크롤러와 JS를 실행하지 않는 클라이언트가
        실제 리뷰 목록이 담긴 HTML을 받게 됩니다.
      */}
      <Suspense
        fallback={
          <ReviewHomeView
            category={null}
            tag={null}
            isbn={null}
            searchQuery=""
            showAdBanner={false}
          />
        }
      >
        <ReviewHomeViewWithParams />
      </Suspense>
    </ServerQueryBoundary>
  );
}
