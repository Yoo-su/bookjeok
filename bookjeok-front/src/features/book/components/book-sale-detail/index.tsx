"use client";

import { AlertTriangle } from "lucide-react";

import { useBookSaleDetailQuery } from "@/features/book/queries";

import { BookInfoCard } from "./book-info-card";
import { BookSaleActions } from "./book-sale-actions";
import { BookSaleInfo } from "./book-sale-info";
import { SaleLocationMap } from "./sale-location-map";
import { BookSaleDetailSkeleton } from "./skeleton";

interface BookSaleDetailProps {
  saleId: string;
}

export const BookSaleDetail = ({ saleId }: BookSaleDetailProps) => {
  const { data: sale, isLoading, isError } = useBookSaleDetailQuery(saleId);

  if (isLoading) {
    return <BookSaleDetailSkeleton />;
  }

  if (isError || !sale) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 text-red-500">
        <AlertTriangle className="mx-auto h-12 w-12" />
        <p className="mt-4 font-semibold">판매글을 불러올 수 없습니다.</p>
        <p className="text-sm text-gray-600">
          존재하지 않거나 삭제된 게시글일 수 있습니다.
        </p>
      </div>
    );
  }

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
    <div className="max-w-5xl mx-auto py-8 md:py-12 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-8">
          <BookSaleInfo sale={sale} />
          {/* Desktop View: 왼쪽 컬럼 하단에 배치 */}
          <div className="hidden md:block">
            <AdditionalInfo />
          </div>
        </div>

        <div className="space-y-8">
          <BookSaleActions sale={sale} />
          {/* Mobile View: 오른쪽(모바일은 하단) 컬럼 하단에 배치 */}
          <div className="md:hidden">
            <AdditionalInfo />
          </div>
        </div>
      </div>
    </div>
  );
};
