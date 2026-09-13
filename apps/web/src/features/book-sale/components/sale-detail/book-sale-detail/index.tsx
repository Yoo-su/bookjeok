"use client";

import { BookInfo } from "@bookjeok/core";
import { useBookSaleDetailQuery } from "@bookjeok/react-query";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import { Separator } from "@/shared/components/shadcn/separator";
import { NotFoundRedirect } from "@/shared/components/ui/not-found-redirect";
import { PATHS } from "@/shared/constants/paths";

import { BookInfoCard } from "./book-info-card";
import { BookSaleActions } from "./book-sale-actions";
import { BookSaleContent } from "./book-sale-content";
import { BookSaleHeader } from "./book-sale-header";
import { BookSaleImageCarousel } from "./book-sale-image-carousel";
import { BookSaleDetailSkeleton } from "./skeleton";

// 카카오맵 SDK가 무거우므로 지연 로딩
const SaleLocationMap = dynamic(
  () => import("./sale-location-map").then((mod) => mod.SaleLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] rounded-lg animate-pulse bg-muted/30" />
    ),
  },
);

interface BookSaleDetailProps {
  saleId: string;
}

/** book 관계가 빠진 응답을 받았을 때 하위 컴포넌트가 참조할 빈 도서 */
const EMPTY_BOOK: BookInfo = {
  isbn: "",
  title: "",
  author: "",
  publisher: "",
  description: "",
  image: "",
  discount: "0",
};

export const BookSaleDetail = ({ saleId }: BookSaleDetailProps) => {
  const t = useTranslations("market.detail");
  const { data, isLoading, isError } = useBookSaleDetailQuery(saleId);

  if (isLoading) {
    return <BookSaleDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <NotFoundRedirect
        message={t("not_found")}
        fallbackPath={PATHS.BOOK_MARKET}
      />
    );
  }

  // 백엔드가 book 관계를 빠뜨린 응답을 낸 적이 있다. 하위 컴포넌트가 각자 방어하는 대신
  // 진입 지점에서 한 번 정규화한다. 프리렌더 중 500은 ISR에 안 남아 매 요청 재렌더된다.
  const sale = {
    ...data,
    book: data.book ?? EMPTY_BOOK,
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
  };

  // 이미지 목록: 판매자 등록 이미지가 없으면 도서 표지를 사용
  const images =
    sale.imageUrls.length > 0
      ? sale.imageUrls
      : sale.book.image
        ? [sale.book.image]
        : [];

  const AdditionalInfo = () => (
    <div className="space-y-8 mt-10">
      {sale.latitude && sale.longitude && (
        <SaleLocationMap
          latitude={sale.latitude}
          longitude={sale.longitude}
          placeName={sale.placeName}
          city={sale.city}
          district={sale.district}
        />
      )}
      <BookInfoCard sale={sale} />
    </div>
  );

  return (
    <div className="w-full mx-auto py-8 md:py-12 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-8">
          <BookSaleImageCarousel images={images} alt={sale.title} />
          {/* Desktop View: 왼쪽 컬럼 하단에 배치 */}
          <div className="hidden md:block">
            <AdditionalInfo />
          </div>
        </div>

        <div className="space-y-6">
          <BookSaleHeader sale={sale} />
          <Separator />
          <BookSaleActions sale={sale} />
          <Separator />
          <BookSaleContent sale={sale} />
          {/* Mobile View: 오른쪽(모바일은 하단) 컬럼 하단에 배치 */}
          <div className="md:hidden">
            <AdditionalInfo />
          </div>
        </div>
      </div>
    </div>
  );
};
