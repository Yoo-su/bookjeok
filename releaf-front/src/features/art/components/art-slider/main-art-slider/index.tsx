"use client";

import { motion } from "framer-motion";
import { Theater } from "lucide-react";
import { useState } from "react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { useArtListQuery } from "@/features/art/queries";
import { SparklesText } from "@/shared/components/magicui/sparkles-text";
import { Button } from "@/shared/components/shadcn/button";
import { cn } from "@/shared/utils";

import { ArtDomain, Genre, GetArtListParams } from "../../../types";
import { ArtSliderSkeleton } from "../../skeleton";
import { MainArtCard } from "./main-art-card";

const NoResults = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5, ease: "easeInOut" }}
    className="h-[380px] flex flex-col items-center justify-center text-center text-gray-400"
  >
    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
      <div className="absolute h-full w-full animate-pulse rounded-full bg-emerald-400/30 blur-xl"></div>
      <Theater className="relative z-10 h-10 w-10 text-emerald-300" />
    </div>
    <p className="mt-6 text-lg font-semibold text-gray-300">
      앗, 아직 공연 정보가 없어요!
    </p>
    <p className="mt-1 text-sm text-gray-500">
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
    <section className="w-full py-16 bg-gray-900 overflow-hidden">
      <div className="text-center mb-10 px-4">
        <SparklesText
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
          sparklesCount={7}
        >
          {title}
        </SparklesText>
        <p className="mt-4 text-lg text-gray-300">{subtitle}</p>
      </div>

      <div className="relative">
        <div className="flex justify-start sm:justify-center gap-2 py-2 px-4 sm:px-8 overflow-x-auto scrollbar-hide">
          {chips.map((chip) => (
            <Button
              key={chip.genreCode}
              variant={activeGenre === chip.genreCode ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full cursor-pointer px-4 py-1 transition-all duration-300 flex-shrink-0",
                activeGenre === chip.genreCode
                  ? "bg-emerald-600 text-white shadow-lg scale-105 border-emerald-600"
                  : "text-gray-300 bg-white/10 border-white/20 hover:bg-white/20 hover:text-white"
              )}
              onClick={() => setActiveGenre(chip.genreCode)}
            >
              {chip.title}
            </Button>
          ))}
        </div>
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-gray-900 pointer-events-none sm:hidden" />
      </div>

      <div className="mt-4">
        {isLoading ? (
          <ArtSliderSkeleton />
        ) : items.length > 0 ? (
          <Swiper
            key={activeGenre}
            className="!px-4 sm:!px-8 py-8 w-full"
            modules={[Autoplay]}
            slidesPerView={"auto"}
            spaceBetween={16}
            centeredSlides={true}
            loop={items.length > 3}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
          >
            {items.map((item) => (
              <SwiperSlide
                key={item.mt20id}
                className="!w-[240px] sm:!w-[280px]"
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
