"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/shared/components/shadcn/button";
import { PATHS } from "@/shared/constants/paths";

const HERO_IMAGES = [
  "/imgs/review_list_cover.jpg",
  "/imgs/review_list_cover2.jpg",
  "/imgs/review_list_cover3.jpg",
  "/imgs/review_list_cover4.jpg",
];

export function ReviewListHero() {
  const [heroImage, setHeroImage] = useState(HERO_IMAGES[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * HERO_IMAGES.length);
    setHeroImage(HERO_IMAGES[randomIndex]);
  }, []);

  return (
    <section className="relative h-[400px] md:h-[500px] overflow-hidden rounded-xl mb-12 group">
      {/* 백그라운드 이미지 */}
      <Image
        src={heroImage}
        alt="Review List Cover"
        fill
        priority
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 transition-colors duration-700 group-hover:bg-black/50" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-8 h-full flex flex-col justify-center">
        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
            Book Reviews
          </h1>
          <p className="text-lg md:text-xl text-stone-100 mb-8 leading-relaxed font-light drop-shadow-md">
            책을 통해 만나는 새로운 세상.
            <br className="hidden md:block" />
            독자들의 솔직하고 깊이 있는 이야기를 전합니다.
          </p>
          <Button
            asChild
            size="lg"
            className="rounded-full px-8 h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 bg-white text-stone-900 hover:bg-stone-100 hover:scale-105 border-none"
          >
            <Link href={PATHS.REVIEW_WRITE}>리뷰 작성하기</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
