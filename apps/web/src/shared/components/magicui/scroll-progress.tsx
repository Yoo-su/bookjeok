"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import React, { useEffect } from "react";

import { cn } from "@/shared/utils/cn";

export interface ScrollProgressProps {
  className?: string;
  /** Optional section progress (0–1); otherwise tracks the whole page. */
  progress?: number;
}

export function ScrollProgress({ className, progress }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const sectionProgress = useMotionValue(progress ?? 0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (progress !== undefined)
      sectionProgress.set(Math.max(0, Math.min(1, progress)));
  }, [progress, sectionProgress]);
  const source = progress === undefined ? scrollYProgress : sectionProgress;

  const scaleX = useSpring(source, {
    stiffness: 200,
    damping: 50,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-stone-900 via-stone-600 to-stone-400 dark:from-stone-100 dark:via-stone-300 dark:to-stone-500",
        className,
      )}
      style={{
        scaleX: reduced ? source : scaleX,
      }}
    />
  );
}
