"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { PATHS } from "@/shared/constants/paths";

import { useRecentBookSalesQuery } from "../../../queries";
import { RecentSalesSliderSkeleton } from "../skeleton";
import { RecentSaleCard } from "./recent-sale-card";

export const RecentSalesSlider = () => {
  const { data: sales, isLoading, isError } = useRecentBookSalesQuery();

  // 슬라이드가 화면을 충분히 채울 수 있도록 아이템 복제
  // 최소 8개 이상의 슬라이드가 있어야 loop가 자연스럽게 작동
  const displaySales = useMemo(() => {
    if (!sales || sales.length === 0) return [];
    if (sales.length >= 8) return sales;

    // 아이템이 8개 미만이면 복제해서 최소 8개로 만듦
    const multiplier = Math.ceil(8 / sales.length);
    return Array(multiplier)
      .fill(sales)
      .flat()
      .slice(0, Math.max(8, sales.length * 2));
  }, [sales]);

  const SliderHeader = () => (
    <div className="text-left mb-12">
      <div className="flex items-center justify-between mb-4">
        <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-wider text-emerald-600 uppercase bg-emerald-50 rounded-full">
          Just Arrived
        </span>
        <Link
          href={PATHS.BOOK_MARKET}
          className="group flex items-center gap-1 text-stone-500 hover:text-emerald-600 transition-colors"
        >
          <span className="text-sm font-medium relative">
            더보기
            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-emerald-500 transition-all duration-300 group-hover:w-full" />
          </span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
        <span className="text-emerald-800">새로운 만남,</span> 방금 등록된 책
      </h2>
      <p className="mt-4 text-lg text-gray-500 max-w-2xl">
        다른 독자들이 소중히 읽은 책들을 만나보세요.
        <br className="hidden sm:block" />
        지금 이 순간에도 새로운 책들이 등록되고 있습니다.
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <section className="w-full py-16  overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <SliderHeader />
        </div>
        <RecentSalesSliderSkeleton />
      </section>
    );
  }

  if (isError || !sales || sales.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <SliderHeader />
      </div>
      <Swiper
        modules={[Autoplay]}
        slidesPerView={"auto"}
        spaceBetween={24}
        loop={true}
        centeredSlides={true}
        speed={800}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        className="px-4!"
      >
        {displaySales.map((sale, index) => (
          <SwiperSlide key={`${sale.id}-${index}`} className="w-[200px]! py-4">
            <RecentSaleCard sale={sale} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};
