"use client";

import { SceneData } from "@bookjeok/core";
import { motion } from "motion/react";
import Image from "next/image";

import { cn } from "@/shared/utils/cn";

// -----------------------------------------------------------------------------
// 레이아웃 4: 로고 (Logo / Finale)
// 스타일: 결정체 (The Crystallization) - 모든 흐름이 모여 선명한 아이덴티티가 됨
// -----------------------------------------------------------------------------
export const LogoScene = ({ data }: { data: SceneData }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pb-10 text-center">
      {/* 
        시각 효과: The Crystallization (결정체 형성)
        은은한 오라(Aura)가 응축되어 선명한 로고로 변하는 과정 
      */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        {/* Background Aura (Pulsing Light) */}
        <motion.div
          className="absolute h-[600px] w-[600px] rounded-full bg-zinc-100 blur-3xl opacity-0"
          animate={{ opacity: [0, 0.8, 0.5], scale: [0.8, 1.1, 1] }}
          transition={{ duration: 2, ease: "easeOut" }}
        />

        {/* Crystallizing Particle Effect (Optional subtle sparkles) */}
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* 1. The Logo Reveal */}
        <motion.div
          className="relative mb-8"
          initial={{ filter: "blur(20px)", scale: 1.5, opacity: 0 }}
          animate={{ filter: "blur(0px)", scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* 로고 이미지 - 쉐도우로 깊이감 추가 */}
          <div className="relative h-32 w-32 md:h-40 md:w-40 drop-shadow-2xl">
            <Image
              src="/logo-square-sketch.svg"
              alt="Bookjeok Icon"
              fill
              unoptimized
              className="object-contain"
              priority
            />
          </div>
        </motion.div>

        {/* 2. Brand Name (Typography) */}
        <div className="flex items-baseline leading-none tracking-tighter mb-4">
          <motion.span
            className="text-5xl md:text-7xl font-bold text-stone-600"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            book
          </motion.span>

          {/* 'j' - The "Reader J" Icon (Large Scale) */}
          <motion.div
            className="relative mx-1 md:mx-2 flex items-end self-baseline mb-[-4px] md:mb-[-8px]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <svg
              width="32"
              height="56"
              viewBox="0 0 24 42"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-14 md:w-16 md:h-28" // Responsive sizing
            >
              {/* Body */}
              <path
                d="M16 10V28C16 34.6274 10.6274 40 4 40H2"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                className="text-stone-600"
              />
              {/* Head */}
              <circle cx="16" cy="4" r="3.5" className="fill-stone-600" />

              {/* Arm - Animated with delay */}
              <motion.path
                d="M16 19C16 19 13 22 11 25"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="text-stone-600"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.9, duration: 0.8, ease: "easeInOut" }}
              />

              {/* Book - Curved Pages */}
              <motion.path
                d="M4 21C4 21 8 25 11 25C14 25 18 21 18 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-600"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1.0, duration: 0.8, ease: "easeInOut" }}
              />
            </svg>
          </motion.div>

          {/* 'eok' */}
          <motion.span
            className="text-5xl md:text-7xl font-bold ml-[-3.5px] md:ml-[-7px] text-stone-600"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            eok
          </motion.span>
        </div>

        {/* 3. Message (Invitation) */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className={cn(
            "whitespace-pre-wrap text-2xl md:text-4xl font-semibold leading-tight tracking-tight text-stone-800 mt-4",
          )}
        >
          {data.header}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-4 text-stone-500 font-medium tracking-wide uppercase text-sm"
        >
          {data.sub}
        </motion.p>
      </div>
    </div>
  );
};
