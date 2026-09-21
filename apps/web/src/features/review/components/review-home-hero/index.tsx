"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { HERO_IMAGES } from "./hero-images";

interface ReviewHomeHeroProps {
  /** 배경 이미지 경로 (생략 시 첫 번째 이미지) */
  imageSrc?: string;
}

// 리뷰 홈 히어로 섹션
export function ReviewHomeHero({ imageSrc }: ReviewHomeHeroProps) {
  const t = useTranslations("review.hero");
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const heroImage = imageSrc ?? HERO_IMAGES[0];

  // 서버 렌더링된 이미지는 하이드레이션 시점에 이미 로드가 끝나 onLoad가 발화하지 않아
  // 제목/부제가 숨겨진 채 남는다. 마운트 시 complete 여부를 직접 확인해 경합 방지
  const imageRef = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) {
      setIsImageLoaded(true);
    }
  }, []);

  return (
    <section className="relative h-[420px] md:h-[520px] overflow-hidden mb-12 group">
      {/* 백그라운드 이미지 */}
      <Image
        ref={imageRef}
        src={heroImage}
        alt={t("image_alt")}
        fill
        priority
        onLoad={() => setIsImageLoaded(true)}
        className={`object-cover transition-all duration-1000 group-hover:scale-[1.02] ${
          isImageLoaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* 오버레이 - 세련된 그라디언트 */}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-black/10" />

      {/* 콘텐츠 - 하단 정렬 */}
      <div className="relative z-10 w-full mx-auto px-8 h-full flex flex-col justify-end pb-12 md:pb-16">
        <div
          className={`max-w-xl transition-all duration-700 ${
            isImageLoaded
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          {/* 장식 라인 */}
          <div className="h-px w-12 bg-white/40 mb-6" />

          <h1 className="text-3xl font-serif md:text-5xl font-bold text-white/85 mb-4 tracking-tight leading-tight whitespace-pre-wrap">
            {t("title")}
          </h1>
          <p className="text-base md:text-lg text-white/50 mb-8 leading-relaxed font-light whitespace-pre-wrap">
            {t("subtitle")}
          </p>

          {/* CTA 링크 - 미니멀 밑줄 스타일 */}
          <Link
            href={PATHS.REVIEW_WRITE}
            className="-my-2 inline-flex items-center gap-2 py-2 text-white/80 hover:text-white transition-colors duration-300 group/cta"
          >
            <span className="text-sm font-medium border-b border-white/30 pb-0.5 group-hover/cta:border-white/70 transition-colors duration-300">
              {t("button_write")}
            </span>
            <span className="text-xs transition-transform duration-300 group-hover/cta:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* 이미지 로딩 전 배경색 */}
      <div
        className={`absolute inset-0 bg-stone-900 transition-opacity duration-500 -z-10 ${
          isImageLoaded ? "opacity-0" : "opacity-100"
        }`}
      />
    </section>
  );
}
