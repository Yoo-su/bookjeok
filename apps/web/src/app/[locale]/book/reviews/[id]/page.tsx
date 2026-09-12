import { getReview } from "@bookjeok/api-client";
import { reviewKeys } from "@bookjeok/core";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cache } from "react";

import { ReviewJsonLd } from "@/features/review/components/common/review-json-ld";
import { BreadcrumbJsonLd } from "@/shared/components/breadcrumb-json-ld";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { getQueryClient } from "@/shared/libs/query-client";
import { isNotFoundError } from "@/shared/utils/api-error";
import { ReviewDetailView } from "@/views/review-detail-view";

// 본문 수정은 /api/revalidate 웹훅이 즉시 걷어낸다. 상호작용 중인 사용자는
// refetchOnMount가 교정하므로 시간 기반 주기는 크롤러용으로만 남긴다.
export const revalidate = 86400; // 24시간

// ISR 활성화용 빈 파라미터 목록
// - generateStaticParams가 없으면 Next가 Dynamic으로 분류해 revalidate를 무시
// - 빌드 타임 프리렌더 없이 첫 요청 시 생성 후 ISR 캐시에 등록 (dynamicParams 기본값 true)
export function generateStaticParams() {
  return [];
}

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

// React.cache를 사용하여 API 요청 중복 제거 (Request Memoization)
// 부재(404)만 null 반환, 일시적 API 장애는 재던짐 (장애로 만든 404가 1시간 캐시되는 것 방지)
const getCachedReview = cache(async (id: number) => {
  // 숫자가 아닌 URL(/reviews/abc)은 API 호출 없이 404 처리
  // - 400 응답이 장애로 분류돼 500이 나가는 것을 방지
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  try {
    return await getReview(id);
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { locale } = await params;
  const reviewId = Number(id);
  const t = await getTranslations({ locale, namespace: "review.detail" });

  const review = await getCachedReview(reviewId);

  if (!review) {
    return {
      title: t("not_found"),
      description: t("not_found"),
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = review.title;
  const description = `${review.book.title} - ${review.book.author}`;
  const images = review.book.image ? [review.book.image] : [];

  const baseMeta = createPageMetadata({
    title,
    description,
    imageUrl: images[0],
    locale,
    path: `/book/reviews/${reviewId}`,
  });

  return {
    ...baseMeta,
    openGraph: {
      ...baseMeta.openGraph,
      type: "article",
    },
    // 비공개 리뷰는 본문이 마스킹되어 내려오므로 색인 대상에서 제외한다.
    // 제목은 기존대로 노출한다.
    ...(!review.isPublic && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

export default async function Page({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const reviewId = Number(id);
  const queryClient = getQueryClient();

  // 캐시된 API 호출
  const review = await getCachedReview(reviewId);

  if (!review) {
    notFound();
  }

  // QueryClient에 데이터 설정
  queryClient.setQueryData(reviewKeys.detail(reviewId).queryKey, review);

  const t = await getTranslations({ locale, namespace: "header" });
  const breadcrumbs = [
    { name: locale === "ko" ? "홈" : "Home", url: `/${locale}` },
    { name: t("nav.menu_reviews"), url: `/${locale}/book/reviews` },
    { name: review.title, url: `/${locale}/book/reviews/${id}` },
  ];

  return (
    <ServerQueryBoundary queryClient={queryClient}>
      <ReviewJsonLd review={review} locale={locale} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <ReviewDetailView />
    </ServerQueryBoundary>
  );
}
