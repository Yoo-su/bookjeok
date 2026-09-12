import { bookKeys, isValidIsbn } from "@bookjeok/core";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { fetchBookDetail } from "@/features/book/apis/server";
import { BookJsonLd } from "@/features/book/components/common/book-json-ld";
import { prefetchBookSummary } from "@/features/book/queries/prefetch";
import { BreadcrumbJsonLd } from "@/shared/components/breadcrumb-json-ld";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { getQueryClient } from "@/shared/libs/query-client";
import { BookDetailView } from "@/views/book-detail-view";

// 서지 정보는 운영자가 수집 스크립트를 돌릴 때만 바뀐다.
// 변경분은 /api/revalidate 웹훅이 즉시 걷어내므로 시간 기반 주기는 길게 둔다.
export const revalidate = 2592000; // 30일 (60 * 60 * 24 * 30)

// ISR 활성화용 빈 파라미터 목록
// - generateStaticParams가 없으면 Next가 Dynamic으로 분류해 revalidate를 무시
// - 빌드 타임 프리렌더 없이 첫 요청 시 생성 후 ISR 캐시에 등록 (dynamicParams 기본값 true)
// - 실제 ISBN 목록 미사용: 빌드 시 백엔드에 닿지 못해 404가 그대로 구워짐
export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ locale: string; isbn: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { isbn, locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "book.detail.metadata",
  });

  if (!isValidIsbn(isbn)) {
    return createPageMetadata({
      title: t("title"),
      description: t("description"),
      locale,
      path: `/book/${isbn}/detail`,
    });
  }

  try {
    const data = await fetchBookDetail(isbn);
    // items가 없거나 비어있는 경우 처리
    if (!data || !data.items || data.items.length === 0) {
      throw new Error(t("not_found"));
    }

    const book = data.items[0];

    const title =
      book.title.length > 50 ? `${book.title.slice(0, 50)}...` : book.title;

    const description = book.description
      ? book.description.slice(0, 160) +
        (book.description.length > 160 ? "..." : "")
      : t("description");

    return createPageMetadata({
      title,
      description,
      imageUrl: book.image || null,
      locale,
      path: `/book/${isbn}/detail`,
    });
  } catch {
    return createPageMetadata({
      title: t("title"),
      description: t("description"),
      locale,
      path: `/book/${isbn}/detail`,
    });
  }
}

export default async function Page({ params }: Props) {
  const { locale, isbn } = await params;
  setRequestLocale(locale);

  // 미들웨어가 이미 걸러내지만, 라우트 단독으로도 경로 공간을 닫아둔다
  if (!isValidIsbn(isbn)) {
    notFound();
  }

  const queryClient = getQueryClient();

  // AI 요약은 isbn만 필요하므로 상세 조회와 병렬로 시작 (직렬로 두면 TTFB에 그대로 가산)
  // prefetchQuery는 거부하지 않으므로 notFound()로 중단돼도 미처리 거부가 남지 않음
  const summaryPrefetch = prefetchBookSummary(queryClient, isbn);

  // API 장애는 fetchBookDetail에서 throw → 에러 바운더리 (ISR 캐시 미저장)
  // 응답은 정상이고 결과만 없는 경우가 실제 404
  const data = await fetchBookDetail(isbn);
  const book = data?.items?.[0];

  if (!book) {
    notFound();
  }

  queryClient.setQueryData(bookKeys.detail(isbn).queryKey, book);

  await summaryPrefetch;

  const t = await getTranslations({ locale, namespace: "header" });
  const breadcrumbs = [
    { name: locale === "ko" ? "홈" : "Home", url: `/${locale}` },
    { name: t("nav.menu_search"), url: `/${locale}/book/search` },
    { name: book.title, url: `/${locale}/book/${isbn}/detail` },
  ];

  return (
    <ServerQueryBoundary queryClient={queryClient}>
      <BookJsonLd book={book} locale={locale} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <BookDetailView isbn={isbn} />
    </ServerQueryBoundary>
  );
}
