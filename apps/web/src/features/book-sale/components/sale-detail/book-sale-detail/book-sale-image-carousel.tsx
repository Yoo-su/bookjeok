"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperType } from "swiper/types";

import { ChevronLeft, ChevronRight } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { cn } from "@/shared/utils/cn";

interface BookSaleImageCarouselProps {
  images: string[];
  alt: string;
}

export const BookSaleImageCarousel = ({
  images,
  alt,
}: BookSaleImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  // Swiper 초기화 시 인스턴스 저장
  const onSwiperInit = useCallback((swiper: SwiperType) => {
    swiperRef.current = swiper;
  }, []);

  // 슬라이드 변경 시 인덱스 업데이트
  const onSlideChange = useCallback((swiper: SwiperType) => {
    setCurrentIndex(swiper.realIndex);
  }, []);

  // 이전 슬라이드로 이동
  const goToPrevious = useCallback(() => {
    swiperRef.current?.slidePrev();
  }, []);

  // 다음 슬라이드로 이동
  const goToNext = useCallback(() => {
    swiperRef.current?.slideNext();
  }, []);

  // 특정 슬라이드로 이동 (페이지네이션)
  const goToSlide = useCallback((index: number) => {
    swiperRef.current?.slideToLoop(index);
  }, []);

  if (!images.length) return null;

  return (
    <div className="relative group overflow-hidden bg-stone-100 rounded-xl aspect-square w-full">
      <Swiper
        modules={[Autoplay, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        loop={images.length > 1}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        onSwiper={onSwiperInit}
        onSlideChange={onSlideChange}
        className="h-full w-full"
      >
        {images.map((imgSrc, idx) => (
          <SwiperSlide key={idx}>
            <ImageItem imgSrc={imgSrc} alt={`${alt} - ${idx + 1}`} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 네비게이션 버튼 (호버 및 모바일에서 노출) */}
      {images.length > 1 && (
        <>
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm shadow-sm pointer-events-auto"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm shadow-sm pointer-events-auto"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {/* 하단 점 페이지네이션 */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10 pointer-events-none">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={cn(
                "h-2 w-2 rounded-full transition-all shadow-sm pointer-events-auto",
                idx === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/80",
              )}
            />
          ))}
        </div>
      )}

      {/* 이미지 카운터 뱃지 */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 text-xs font-medium rounded-full pointer-events-none z-10">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};

const ImageItem = ({ imgSrc, alt }: { imgSrc: string; alt: string }) => {
  return (
    <div className="w-full shrink-0 h-full relative overflow-hidden bg-stone-200">
      {/* 배경 흐림 효과 이미지 (여백 채우기용) */}
      <div className="absolute inset-0">
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className="object-cover blur-xl scale-110 opacity-60"
          draggable={false}
          priority
        />
      </div>
      {/* 메인 이미지 */}
      <div className="relative h-full w-full">
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className="object-contain"
          draggable={false}
          priority
        />
      </div>
    </div>
  );
};
