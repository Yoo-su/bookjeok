"use client";

import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Autoplay, EffectCoverflow, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { TextAnimate } from "@/shared/components/magicui/text-animate";
import { Button } from "@/shared/components/shadcn/button";
import { PATHS } from "@/shared/constants/paths";

import { MAIN_PUBLISHERS } from "../../constants";
import { useBookListQuery } from "../../queries";
import { BookSliderSkeleton } from "./skeleton";

// 슬라이더에 적용할 커스텀 스타일
const SwiperStyles = () => (
  <style>{`
    .book-swiper-container {
      padding-top: 20px;
      padding-bottom: 50px;
    }
    .book-swiper {
      padding: 4rem 0;
      overflow: visible;
    }
    .book-swiper .swiper-wrapper {
      align-items: center;
    }
    .book-swiper .swiper-slide {
      transition: transform 0.4s ease-in-out, filter 0.4s ease-in-out;
      filter: brightness(0.6);
      transform: scale(0.8);
      opacity: 1;
      cursor: pointer;
    }
    .book-swiper .swiper-slide-active {
      transform: scale(1.05) translateY(-25px);
      filter: brightness(1);
      z-index: 10;
    }
    .book-swiper .swiper-slide-next,
    .book-swiper .swiper-slide-prev {
      transform: scale(0.9);
      filter: brightness(0.8);
    }
    .book-swiper .swiper-button-next,
    .book-swiper .swiper-button-prev {
      color: #374151; /* gray-700 */
      background-color: rgba(255, 255, 255, 0.7);
      border-radius: 9999px;
      width: 44px;
      height: 44px;
      transition: background-color 0.3s, box-shadow 0.3s;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
    .book-swiper .swiper-button-next:hover,
    .book-swiper .swiper-button-prev:hover {
      background-color: rgba(255, 255, 255, 1);
    }
    .book-swiper .swiper-button-next::after,
    .book-swiper .swiper-button-prev::after {
      display: none;
    }
    .book-info-overlay {
      transition: background-color 0.5s, opacity 0.5s;
    }
    .book-info-overlay > * {
      transform: translateY(16px);
      transition: transform 0.5s;
    }
    .swiper-slide-active .group:hover .book-info-overlay {
      background-color: rgba(0, 0, 0, 0.7);
      opacity: 1;
    }
    .swiper-slide-active .group:hover .book-info-overlay > * {
      transform: translateY(0);
    }
    .swiper-slide-active .group:hover .book-info-overlay h3 {
      transition-delay: 0.1s;
    }
    .swiper-slide-active .group:hover .book-info-overlay p {
      transition-delay: 0.2s;
    }
  `}</style>
);

export const MainBookSlider = () => {
  const [activePublisher, setActivePublisher] = useState(MAIN_PUBLISHERS[0]);
  const swiperRef = useRef<any>(null);

  // Tanstack Query를 사용해 데이터 조회
  const {
    data: books,
    isLoading,
    isError,
  } = useBookListQuery({ query: activePublisher });

  useEffect(() => {
    // 출판사가 변경되면 Swiper 인스턴스를 업데이트하여 루프 상태 등을 재설정
    if (swiperRef.current) {
      swiperRef.current.update();
      swiperRef.current.slideTo(Math.floor((books?.length || 0) / 2), 0, false);
    }
  }, [books]);

  return (
    <div className="w-full bg-linear-to-b from-white via-gray-50 to-white py-8">
      <SwiperStyles />
      <div className="mx-auto max-w-5xl px-4 text-center">
        <TextAnimate
          as="h2"
          animation="scaleUp"
          by="line"
          className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        >
          주목할 만한 도서
        </TextAnimate>
        <TextAnimate
          animation="slideUp"
          by="word"
          as="p"
          className="mt-4 text-lg leading-8 text-gray-600"
        >
          엄선된 출판사의 베스트셀러를 만나보세요.
        </TextAnimate>
      </div>

      {/* 출판사 필터 칩 */}
      <div className="flex justify-center items-center gap-2 mt-8 flex-wrap px-4">
        {MAIN_PUBLISHERS.map((publisher) => (
          <Button
            key={publisher}
            variant={activePublisher === publisher ? "default" : "outline"}
            className={`rounded-full cursor-pointer transition-all duration-300 ${
              activePublisher === publisher
                ? "bg-emerald-700 text-white shadow-lg scale-105"
                : "text-gray-600 bg-white"
            }`}
            onClick={() => setActivePublisher(publisher)}
          >
            {publisher}
          </Button>
        ))}
      </div>

      {isLoading && <BookSliderSkeleton />}

      {!isLoading && (isError || !books || books.length === 0) && (
        <div className="text-center py-20 text-gray-500">
          <BookOpen className="mx-auto h-12 w-12" />
          <p className="mt-4">도서 정보를 불러올 수 없습니다.</p>
        </div>
      )}

      {!isLoading && books && books.length > 0 && (
        <div className="relative w-full book-swiper-container overflow-hidden">
          <Swiper
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            effect={"coverflow"}
            grabCursor={true}
            centeredSlides={true}
            loop={books.length > 3} // 슬라이드가 충분히 많을 때만 루프
            slidesPerView={"auto"}
            spaceBetween={-50}
            initialSlide={Math.floor(books.length / 2)}
            coverflowEffect={{
              rotate: 0,
              stretch: 80,
              depth: 200,
              modifier: 1,
              slideShadows: false,
            }}
            navigation={{
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
            }}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            modules={[EffectCoverflow, Navigation, Autoplay]}
            className="book-swiper"
          >
            {books.map((book, index) => (
              <SwiperSlide
                key={`${book.isbn}-${index}`} // 고유한 키 보장
                className="w-[240px]! md:w-[300px]!"
              >
                <Link href={PATHS.BOOK_DETAIL(book.isbn)} passHref>
                  <div className="group relative w-full h-[360px] md:h-[450px] rounded-lg overflow-hidden shadow-2xl transform transition-transform duration-500">
                    <Image
                      src={book.image || "/placeholder.jpg"}
                      alt={book.title}
                      fill
                      sizes="(max-width: 768px) 240px, 300px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://placehold.co/300x450/e2e8f0/64748b?text=Image";
                      }}
                    />
                    <div className="book-info-overlay absolute inset-0 bg-black bg-opacity-0 flex flex-col justify-end items-center p-6 text-center opacity-0">
                      <h3 className="text-white font-bold text-xl md:text-2xl mb-2 drop-shadow-lg">
                        {book.title}
                      </h3>
                      <p className="text-gray-200 text-sm md:text-base drop-shadow-md">
                        {book.author}
                      </p>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}

            <div className="swiper-button-prev">
              <ChevronLeft size={24} />
            </div>
            <div className="swiper-button-next">
              <ChevronRight size={24} />
            </div>
          </Swiper>
        </div>
      )}
    </div>
  );
};
