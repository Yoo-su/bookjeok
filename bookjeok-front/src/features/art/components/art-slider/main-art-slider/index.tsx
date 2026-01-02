"use client";

import { motion } from "framer-motion";
import { Theater } from "lucide-react";
import { useState } from "react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { useArtListQuery } from "@/features/art/queries";
import { Button } from "@/shared/components/shadcn/button";
import { cn } from "@/shared/utils";

import { ArtDomain, Genre, GetArtListParams } from "../../../types";
import { ArtSliderSkeleton } from "../skeleton";
import { MainArtCard } from "./main-art-card";

// 결과 없음 상태 컴포넌트
const NoResults = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5, ease: "easeInOut" }}
    className="h-[380px] flex flex-col items-center justify-center text-center"
  >
    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-rose-50">
      <div className="absolute h-full w-full animate-pulse rounded-full bg-rose-100/50 blur-xl" />
      <Theater className="relative z-10 h-10 w-10 text-rose-400" />
    </div>
    <p className="mt-6 text-lg font-semibold text-stone-700">
      앗, 아직 공연 정보가 없어요!
    </p>
    <p className="mt-1 text-sm text-stone-400">
      다른 카테고리를 확인해보시겠어요?
    </p>
  </motion.div>
);

interface MainArtSliderProps {
  title: string;
  subtitle: string;
  chips: ArtDomain[];
  queryOptions?: Omit<GetArtListParams, "genreCode">;
}

export const MainArtSlider = ({
  title,
  subtitle,
  chips,
  queryOptions,
}: MainArtSliderProps) => {
  const [activeGenre, setActiveGenre] = useState<Genre>(chips[0].genreCode);

  const { data: items = [], isLoading } = useArtListQuery({
    ...queryOptions,
    genreCode: activeGenre,
  });

  return (
    <section className="w-full py-16 bg-linear-to-b from-stone-50 to-white overflow-hidden">
      {/* 헤더 섹션 */}
      <div className="text-center mb-10 px-4">
        <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 text-base text-stone-500">{subtitle}</p>
      </div>

      {/* 장르 필터 칩 */}
      <div className="flex flex-wrap justify-center gap-2 py-2 px-4 sm:px-8">
        {chips.map((chip) => (
          <Button
            key={chip.genreCode}
            variant={activeGenre === chip.genreCode ? "default" : "outline"}
            size="sm"
            className={cn(
              "rounded-full cursor-pointer px-5 py-2 transition-all duration-300 font-medium",
              activeGenre === chip.genreCode
                ? "bg-rose-500 text-white shadow-lg shadow-rose-200 scale-105 border-rose-500 hover:bg-rose-600"
                : "text-stone-600 bg-white border-stone-200 hover:bg-stone-50 hover:border-stone-300"
            )}
            onClick={() => setActiveGenre(chip.genreCode)}
          >
            {chip.title}
          </Button>
        ))}
      </div>

      {/* 슬라이더 */}
      <div className="mt-6">
        {isLoading ? (
          <ArtSliderSkeleton />
        ) : items.length > 0 ? (
          <Swiper
            key={activeGenre}
            className="px-4! sm:px-8! py-8 w-full overflow-visible! [clip-path:inset(-100px_-10px)]"
            modules={[Autoplay]}
            slidesPerView={"auto"}
            spaceBetween={20}
            centeredSlides={true}
            loop={items.length > 3}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
          >
            {items.map((item) => (
              <SwiperSlide
                key={item.mt20id}
                className="w-[260px]! sm:w-[300px]!"
              >
                <MainArtCard item={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <NoResults />
        )}
      </div>
    </section>
  );
};
