"use client";

import { SceneData } from "@bookjeok/core";
import { motion } from "motion/react";

import { cn } from "@/shared/utils/cn";

// -----------------------------------------------------------------------------
// 레이아웃 1: 독서 기록 (Record)
// 스타일: 감성적, 평온함, 명조체 (Serif)
// -----------------------------------------------------------------------------
export const RecordScene = ({ data }: { data: SceneData }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-start pb-10 md:px-12">
      <div className="relative z-10 max-w-xl">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-stone-400"></span>
          <span className="text-xs font-bold tracking-[0.2em] text-stone-500 uppercase">
            {data.sub}
          </span>
        </motion.div>

        <div className="overflow-hidden py-1">
          <motion.h2
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "whitespace-pre-wrap text-[3.5rem] font-medium leading-[1.1] tracking-tight text-stone-900 sm:text-[4rem] md:text-[5rem]",
            )}
          >
            {data.header}
          </motion.h2>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-8 whitespace-pre-wrap text-lg leading-relaxed text-stone-600 md:text-xl"
        >
          {data.desc}
        </motion.p>
      </div>

      {/* 시각 효과: 정제된 미니멀 낙서 효과 (Refined Minimal Scribble) */}
      <div className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 opacity-[0.08] md:right-32">
        <svg
          width="400"
          height="400"
          viewBox="0 0 200 200"
          className="scale-150 rotate-6 md:scale-100"
        >
          <motion.path
            d="M 20,40 H 180 M 20,60 H 180 M 20,80 H 180 M 20,100 H 180 M 20,120 H 180"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-black"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          <motion.path
            d="M 40,70 C 60,60 70,80 90,70 S 130,80 150,60"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="3"
            className="text-stone-900"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.8, duration: 1.5, ease: "circOut" }}
          />
        </svg>
      </div>
    </div>
  );
};
