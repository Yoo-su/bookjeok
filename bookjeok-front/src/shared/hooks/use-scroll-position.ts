"use client";

import { useEffect, useState } from "react";

/**
 * 현재 스크롤 위치를 반환하는 커스텀 훅
 * @param throttleMs - 성능 최적화를 위한 throttle 시간 (기본값: 100ms)
 * @returns 현재 스크롤 Y 위치
 */
export const useScrollPosition = (throttleMs: number = 100) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    let lastScrollY = 0;

    const handleScroll = () => {
      lastScrollY = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(lastScrollY);
          ticking = false;
        });

        // throttle 적용
        ticking = true;
        setTimeout(() => {
          ticking = false;
        }, throttleMs);
      }
    };

    // 초기 스크롤 위치 설정
    setScrollY(window.scrollY);

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [throttleMs]);

  return scrollY;
};
