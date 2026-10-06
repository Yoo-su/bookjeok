"use client";

import { motion } from "motion/react";

import type { useKongFlail } from "../hooks/use-kong-flail";
import type { KongFace } from "../lib/kong-art";
import { KongFigure } from ".";

interface FlailingKongProps {
  size: number;
  flail: ReturnType<typeof useKongFlail>;
  /** 바둥거리지 않을 때 표정 */
  restFace?: KongFace;
  boil?: boolean;
  seed?: number;
  className?: string;
}

/** `useKongFlail` 상태대로 팔다리를 꺼내 좌우로 흔드는 콩 */
export function FlailingKong({
  size,
  flail,
  restFace = "smile",
  boil,
  seed,
  className,
}: FlailingKongProps) {
  const wiggle = flail.flailing && !flail.reduced;
  return (
    <motion.span
      className={className ?? "block"}
      animate={wiggle ? { rotate: [-7, 7] } : { rotate: 0 }}
      transition={
        wiggle
          ? {
              duration: 0.18,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }
          : { duration: 0.15 }
      }
    >
      <KongFigure
        size={size}
        face={flail.flailing ? flail.face : restFace}
        limbs={flail.limbs}
        boil={boil}
        seed={seed}
      />
    </motion.span>
  );
}
