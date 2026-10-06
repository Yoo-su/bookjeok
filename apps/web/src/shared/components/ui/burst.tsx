"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/shared/utils";

interface BurstProps {
  /** 점 색. `bg-current`라 text 색 클래스를 넘긴다 */
  className?: string;
  particles?: number;
  /** 중심에서 점이 날아가는 거리(px). 홀수 번째 점은 이보다 짧게 날아간다 */
  distance?: number;
  /** 점 지름(px) */
  size?: number;
}

/**
 * 아이콘 둘레로 점이 한 번 퍼지는 효과. 부모는 `relative`여야 하고,
 * 다시 터뜨리려면 `key`를 바꿔 새로 마운트한다.
 */
export function Burst({
  className,
  particles = 8,
  distance = 22,
  size = 6,
}: BurstProps) {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {Array.from({ length: particles }, (_, index) => {
        const angle = (index / particles) * Math.PI * 2;
        const reach = index % 2 ? distance * 0.72 : distance;
        return (
          <motion.span
            key={index}
            className={cn(
              "absolute left-1/2 top-1/2 rounded-full bg-current",
              className,
            )}
            style={{
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
            }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * reach,
              y: Math.sin(angle) * reach,
              scale: 0,
              opacity: 0,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        );
      })}
    </span>
  );
}
