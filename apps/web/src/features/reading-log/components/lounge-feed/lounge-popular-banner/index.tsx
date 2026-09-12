"use client";

import type { LoungePopularBook } from "@bookjeok/core";
import { useLoungePopularQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { Swiper, SwiperSlide } from "swiper/react";

import { Skeleton } from "@/shared/components/shadcn/skeleton";

import { LoungePopularBannerCard } from "./lounge-popular-banner-card";
interface LoungePopularBannerProps {
  onCardClick?: (
    isbn: string,
    book: LoungePopularBook["book"],
    totalCount: number,
  ) => void;
}

export function LoungePopularBanner({ onCardClick }: LoungePopularBannerProps) {
  const t = useTranslations("lounge.popular");
  const { data, isLoading } = useLoungePopularQuery();

  if (isLoading) {
    return (
      <section>
        <div className="mb-10">
          <Skeleton className="h-8 w-48 mb-3" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-5 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-44 shrink-0">
              <Skeleton className="aspect-2/3 w-full rounded-xl mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // 백엔드가 형태가 어긋난 200을 주면 여기서 터지고, 페이지 전체가 500이 된다.
  // 500은 ISR에 남지 않아 매 요청 재렌더되므로 섹션 부재로 흡수한다.
  if (!data?.items?.length) return null;

  return (
    <section>
      {/* 섹션 헤더: 기존 슬라이더 헤더 패턴 */}
      <div className="mb-10 border-b border-stone-200 pb-5">
        <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-medium tracking-tight">
          {t("title")}
        </h2>
        <p className="mt-2 text-sm sm:text-base text-stone-500 font-light">
          {t("subtitle")}
        </p>
      </div>

      {/* 수평 스크롤 카드 */}
      <Swiper
        slidesPerView="auto"
        spaceBetween={20}
        className="pb-4 pt-4 -mt-4 -mx-4 px-4! md:mx-0 md:px-0!"
      >
        {data.items.map((item, index) => (
          <SwiperSlide
            key={item.isbn}
            className="w-44! select-none cursor-pointer"
            onClick={() =>
              onCardClick &&
              onCardClick(item.isbn, item.book, Number(item.readerCount))
            }
          >
            <LoungePopularBannerCard item={item} index={index} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
