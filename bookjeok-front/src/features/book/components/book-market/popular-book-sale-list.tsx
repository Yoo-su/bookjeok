"use client";

import { Swiper, SwiperSlide } from "swiper/react";

import { BookSaleCard } from "@/features/book/components/common/book-sale-card";
import { usePopularBookSalesQuery } from "@/features/book/queries";
import { Badge } from "@/shared/components/shadcn/badge";

export function PopularBookSaleList() {
  const { data: sales, isLoading, isError } = usePopularBookSalesQuery();

  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold text-stone-900">
            🔥 지금 뜨는 중고책
          </h2>
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-600 hover:bg-orange-200"
          >
            HOT
          </Badge>
        </div>

        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[70%] sm:min-w-[40%] md:min-w-[30%] lg:min-w-[22%]"
            >
              <BookSaleCard.Skeleton />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isError || !sales || sales.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-stone-900">
          🔥 지금 뜨는 중고책
        </h2>
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-600 hover:bg-orange-200"
        >
          HOT
        </Badge>
      </div>

      <Swiper
        spaceBetween={16}
        slidesPerView={1.3}
        breakpoints={{
          480: { slidesPerView: 2.2 },
          768: { slidesPerView: 3.2 },
          1024: { slidesPerView: 4.2 },
        }}
        className="w-full px-1! pb-4!"
      >
        {sales.map((sale, index) => (
          <SwiperSlide key={sale.id}>
            <BookSaleCard sale={sale} rank={index + 1} showEffect={false} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
