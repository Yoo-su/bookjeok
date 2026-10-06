"use client";

import { SceneData } from "@bookjeok/core";
import { motion } from "motion/react";

import { cn } from "@/shared/utils/cn";

// -----------------------------------------------------------------------------
// 레이아웃 2: 중고책 (Used)
// 스타일: 모던, 명료함, 스위스 스타일 산세리프 (Modern, Clear, Swiss-Style Sans)
// -----------------------------------------------------------------------------
export const UsedScene = ({ data }: { data: SceneData }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pb-10 text-center">
      {/* 시각 효과: The Fluid Connection (유동적 연결) - 서로에게 물들다 */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        {/* 좌측 빛방울 (따뜻한 Zinc 톤) */}
        <motion.div
          className="absolute top-1/2 left-1/2 -ml-32 -mt-32 h-64 w-64 rounded-full bg-zinc-400 blur-[20px]"
          initial={{ x: -200, scale: 0.8, opacity: 0 }}
          animate={{ x: -50, scale: [0.8, 1.1, 0.9], opacity: 0.8 }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        {/* 우측 빛방울 (차가운 Slate 톤) */}
        <motion.div
          className="absolute top-1/2 left-1/2 -ml-32 -mt-32 h-64 w-64 rounded-full bg-slate-400 blur-[20px]"
          initial={{ x: 200, scale: 0.8, opacity: 0 }}
          animate={{ x: 50, scale: [0.8, 0.9, 1.1], opacity: 0.8 }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            delay: 0.5,
            times: [0, 0.5, 1],
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        {/* 교차점 스파크 (연결 강조) */}
        <motion.div
          className="absolute top-1/2 left-1/2 -ml-16 -mt-16 z-10 h-32 w-32 rounded-full bg-zinc-500 blur-[50px] opacity-0"
          animate={{ opacity: [0, 0.9, 0] }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </div>

      <div className="relative z-10 md:-mt-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 flex items-center justify-center gap-3"
        >
          <span className="h-px w-8 bg-stone-400"></span>
          <span className="text-xs font-bold tracking-[0.2em] text-stone-500 uppercase">
            {data.sub}
          </span>
          <span className="h-px w-8 bg-stone-400"></span>
        </motion.div>

        {/* 헤더: 굵은 산세리프, 좁은 자간 (Heavy Sans, Tight Tracking) */}
        <div className="flex flex-col items-center">
          <motion.h2
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              "whitespace-pre-wrap text-6xl font-medium leading-[1.05] tracking-tight text-stone-900 sm:text-7xl md:text-[5.5rem]",
            )}
          >
            {data.header}
          </motion.h2>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-8 whitespace-pre-wrap text-lg leading-relaxed text-stone-600 md:text-xl"
        >
          {data.desc}
        </motion.p>
      </div>
    </div>
  );
};
