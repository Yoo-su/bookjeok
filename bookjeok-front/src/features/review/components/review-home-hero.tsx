"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/shared/components/shadcn/button";
import { PATHS } from "@/shared/constants/paths";

const HERO_IMAGES = [
  "/imgs/review_list_cover.jpg",
  "/imgs/review_list_cover2.jpg",
  "/imgs/review_list_cover3.jpg",
  "/imgs/review_list_cover4.jpg",
];

export function ReviewHomeHero() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // useMemo로 랜덤 이미지 선택 (컴포넌트 마운트 시 한 번만)
  const heroImage = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
    return HERO_IMAGES[randomIndex];
  }, []);

  // 클라이언트에서만 isImageLoaded 상태 활성화 (hydration mismatch 방지)
  useEffect(() => {
    setIsImageLoaded(false);
  }, [heroImage]);

  return (
    <section className="relative h-[400px] md:h-[500px] overflow-hidden rounded-xl mb-12 group">
      {/* 백그라운드 이미지 */}
      <Image
        src={heroImage}
        alt="Review List Cover"
        fill
        priority
        onLoad={() => setIsImageLoaded(true)}
        className={`object-cover transition-all duration-700 group-hover:scale-105 ${
          isImageLoaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/40 transition-colors duration-700 group-hover:bg-black/50" />

      {/* 콘텐츠 */}
      <div className="relative z-10 container mx-auto px-8 h-full flex flex-col justify-center">
        <div
          className={`max-w-2xl transition-all duration-700 ${
            isImageLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <h1
            className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight leading-tight"
            style={{
              textShadow:
                "0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 255, 255, 0.15), 0 2px 4px rgba(0, 0, 0, 0.3)",
            }}
          >
            Book Reviews
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed font-light">
            독자들의 솔직한 감상을 만나보세요.
            <br className="hidden md:block" />
            당신의 다음 책을 찾는 여정에 함께합니다.
          </p>
          <Button
            asChild
            size="lg"
            className="rounded-full px-8 h-14 text-lg font-medium transition-all duration-300 backdrop-blur-xl bg-white/20 text-white border border-white/30 shadow-[0_8px_32px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:bg-white/30 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-105"
          >
            <Link href={PATHS.REVIEW_WRITE}>리뷰 작성하기</Link>
          </Button>
        </div>
      </div>

      {/* 이미지 로딩 전 배경색 */}
      <div
        className={`absolute inset-0 bg-stone-800 transition-opacity duration-500 -z-10 ${
          isImageLoaded ? "opacity-0" : "opacity-100"
        }`}
      />
    </section>
  );
}
