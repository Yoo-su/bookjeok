import { getBookSaleDetail } from "@bookjeok/api-client";
import { bookSaleKeys } from "@bookjeok/core";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { cache } from "react";

import { BookSaleJsonLd } from "@/features/book-sale/components/common/book-sale-json-ld";
import { BreadcrumbJsonLd } from "@/shared/components/breadcrumb-json-ld";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { getQueryClient } from "@/shared/libs/query-client";
import { isNotFoundError } from "@/shared/utils/api-error";
import { BookSaleDetailView } from "@/views/book-sale-detail-view";

// 판매 상태 변경은 /api/revalidate 웹훅이 즉시 걷어낸다.
// 5분 주기는 쓰기만 늘리고 적중률을 떨어뜨려 ISR을 SSR로 퇴화시킨다.
export const revalidate = 3600; // 1시간

// ISR 활성화용 빈 파라미터 목록
// - generateStaticParams가 없으면 Next가 Dynamic으로 분류해 revalidate를 무시
// - 빌드 타임 프리렌더 없이 첫 요청 시 생성 후 ISR 캐시에 등록 (dynamicParams 기본값 true)
export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

// React.cache를 사용하여 API 요청 중복 제거
// 부재(404)만 null 반환, 일시적 API 장애는 재던짐 (장애로 만든 404가 캐시에 고착되는 것 방지)
const getCachedBookSale = cache(async (id: string) => {
  // 숫자가 아닌 URL(/sales/abc)은 API 호출 없이 404 처리
  // - 400 응답이 장애로 분류되면 500이 나가고, 500은 ISR에 안 남아 매 요청 재렌더된다
  if (!/^[1-9]\d*$/.test(id)) {
    return null;
  }

  try {
    return await getBookSaleDetail(id);
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
});

// 동적 메타데이터 생성
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "market.detail" });

  try {
    const sale = await getCachedBookSale(id);

    if (!sale) {
      return {
        title: t("not_found"),
        description: t("not_found"),
      };
    }

    const title = sale.title;
    const description = `${sale.book.title} | ${sale.price.toLocaleString()}원 | ${sale.city} ${sale.district}`;
    const images =
      sale.imageUrls.length > 0
        ? [sale.imageUrls[0]]
        : sale.book.image
          ? [sale.book.image]
          : [];

    const baseMeta = createPageMetadata({
      title,
      description,
      imageUrl: images[0],
      locale,
      path: `/book/sales/${id}`,
    });

    return {
      ...baseMeta,
      openGraph: {
        ...baseMeta.openGraph,
        type: "article",
      },
    };
  } catch {
    return createPageMetadata({
      title: t("book_info.title"),
      description: t("not_found"),
    });
  }
}

export default async function Page({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const queryClient = getQueryClient();

  // API 장애는 getCachedBookSale에서 throw → 에러 바운더리 (ISR 캐시 미저장)
  const sale = await getCachedBookSale(id);

  if (!sale) {
    notFound();
  }

  // QueryClient에 데이터 설정
  queryClient.setQueryData(bookSaleKeys.saleDetail(id).queryKey, sale);

  const t = await getTranslations({ locale, namespace: "header" });
  const breadcrumbs = [
    { name: locale === "ko" ? "홈" : "Home", url: `/${locale}` },
    { name: t("nav.menu_market"), url: `/${locale}/book/market` },
    { name: sale.title, url: `/${locale}/book/sales/${id}` },
  ];

  return (
    <ServerQueryBoundary queryClient={queryClient}>
      <BookSaleJsonLd sale={sale} locale={locale} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <BookSaleDetailView saleId={id} />
    </ServerQueryBoundary>
  );
}
