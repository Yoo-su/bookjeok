"use client";

import { SceneData } from "@bookjeok/core";
import { motion } from "motion/react";

import { cn } from "@/shared/utils/cn";

// -----------------------------------------------------------------------------
// 레이아웃 3: 리뷰 (Review)
// 스타일: 에디토리얼, 세련됨, 고대비 (Editorial, Sophisticated, High-Contrast)
// -----------------------------------------------------------------------------
export const ReviewScene = ({ data }: { data: SceneData }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-end overflow-hidden pb-10 md:px-16">
      {/* 시각 효과: 바람/산들바람 애니메이션 (스케치 스타일) */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <svg
          className="h-full w-full text-zinc-300/60"
          viewBox="0 0 800 400"
          preserveAspectRatio="none"
        >
          {/* 흐름 1 (길고 유려하게 - Long & Flowy) */}
          <motion.path
            d="M -100,200 C 200,100 400,300 600,200 S 900,100 1200,250"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
          />
          {/* 흐름 2 (느리고 얇게 - Slower, Thinner) */}
          <motion.path
            d="M -100,280 C 100,320 300,200 600,300 S 1000,250 1300,320"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{ duration: 3, delay: 0.2, ease: "easeOut" }}
          />
          {/* 흐름 3 (상단 소용돌이 - Upper Swirl) */}
          <motion.path
            d="M -50,120 C 150,50 350,180 650,100 S 950,50 1100,120"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="10 10"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 2.2, delay: 0.4, ease: "easeInOut" }}
          />
          {/* 바람에 실려가는 작은 입자들 (Small Particles carried by wind) */}
          <motion.circle
            cx="200"
            cy="150"
            r="1.5"
            fill="currentColor"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 600, opacity: [0, 1, 0] }}
            transition={{ duration: 2.5, delay: 1, ease: "linear" }}
          />
          <motion.circle
            cx="400"
            cy="250"
            r="2"
            fill="currentColor"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 500, opacity: [0, 1, 0] }}
            transition={{ duration: 2.8, delay: 1.5, ease: "linear" }}
          />
        </svg>
      </div>
      <div className="relative z-10 flex flex-col items-end text-right">
        {/* 시각 효과: 은은한 따옴표 (Subtle Quote Mark) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute -top-20 -left-20 -z-10 hidden select-none font-serif text-[200px] leading-none text-zinc-100 md:block"
        >
          &ldquo;
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 flex items-center justify-end gap-3"
        >
          <span className="text-xs font-bold tracking-[0.2em] text-stone-500 uppercase">
            {data.sub}
          </span>
          <span className="h-px w-8 bg-stone-400"></span>
        </motion.div>

        {/* 헤더: 다양성을 위한 나눔 고딕 또는 깔끔한 산세리프?
            사용자가 다른 폰트를 원했습니다. Pretendard Thin/Light 대 Bold로 좋은 대비를 줍니다.
            여기서는 Pretendard Light + Large를 사용하여 독특한 스타일링을 적용합니다.
        */}
        <div className="overflow-hidden">
          <motion.h2
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "whitespace-pre-wrap text-5xl font-medium leading-tight tracking-tight text-stone-900 sm:text-6xl md:text-7xl",
            )}
          >
            {/* 우아함을 위해 단순하게 유지 (Split lines to stagger X) */}
            {data.header}
          </motion.h2>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-8 max-w-sm whitespace-pre-wrap text-lg leading-relaxed text-stone-600"
        >
          {data.desc}
        </motion.p>

        {/* 리뷰 별점 시각화 (Review Star Rating Visual) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-6 flex gap-1 text-zinc-300"
        >
          {[1, 2, 3, 4, 5].map((_, i) => (
            <span key={i} className={i < 4 ? "text-amber-400" : ""}>
              ★
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
