"use client";

import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { useRecentBookSalesQuery } from "../../../queries";
import { RecentSalesSliderSkeleton } from "../skeleton";
import { RecentSaleCard } from "./recent-sale-card";

export const RecentSalesSlider = () => {
  const { data: sales, isLoading, isError } = useRecentBookSalesQuery();

  const SliderHeader = () => (
    <div className="text-center mb-10">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
          따끈따끈,
        </span>
        지금 막 올라왔어요!
      </h2>
      <p className="mt-4 text-lg text-gray-600">
        가장 새로운 중고 서적들을 만나보세요.
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <section className="w-full py-12 bg-gray-50/50 overflow-hidden">
        <SliderHeader />
        <RecentSalesSliderSkeleton />
      </section>
    );
  }

  if (isError || !sales || sales.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-12 bg-gray-50/50 overflow-hidden">
      <SliderHeader />
      <Swiper
        modules={[Autoplay]}
        slidesPerView={"auto"}
        spaceBetween={32}
        loop={sales.length > 5}
        centeredSlides={true}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        className="!px-4"
      >
        {sales.map((sale) => (
          <SwiperSlide key={sale.id} className="!w-40">
            <RecentSaleCard sale={sale} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};
