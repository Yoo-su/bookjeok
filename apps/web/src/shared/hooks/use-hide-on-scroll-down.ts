"use client";

import { useEffect, useState } from "react";

/** 방향 판정 전 누적 이동량(px). 관성 스크롤 끝의 미세한 역방향을 무시 */
const DELTA = 8;

/**
 * 아래로 스크롤하면 true, 위로 스크롤하거나 상단 근처면 false
 * @param topOffset 이 높이 안에서는 항상 false
 */
export function useHideOnScrollDown(topOffset = 80) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    const read = () => {
      const y = window.scrollY;
      if (y <= topOffset) {
        setHidden(false);
        lastY = y;
        return;
      }
      if (Math.abs(y - lastY) < DELTA) return;
      setHidden(y > lastY);
      lastY = y;
    };

    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, [topOffset]);

  return hidden;
}
