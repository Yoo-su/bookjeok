"use client";

import { MotionConfig } from "motion/react";

/**
 * OS에서 "동작 줄이기"를 켠 사용자에게는 모든 Motion 애니메이션의
 * 이동·크기 변화를 끄고 투명도 변화만 남긴다.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
