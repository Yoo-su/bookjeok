"use client";

import { useEffect, useState } from "react";

/**
 * 스크롤이 기준선을 넘었는지 여부만 반환합니다.
 *
 * `use-scroll-position`처럼 좌표를 그대로 돌려주면 스크롤하는 동안 구독자가
 * 계속 리렌더됩니다. 헤더처럼 무거운 트리에서는 기준선을 넘나드는 순간에만
 * 리렌더되는 편이 낫습니다.
 *
 * `window.scrollY`는 브라우저가 이미 계산해 둔 값이라 스크롤 핸들러에서 바로
 * 읽어도 레이아웃을 강제하지 않습니다. 그래서 requestAnimationFrame으로
 * 묶지 않습니다 — rAF는 문서가 보이지 않는 동안 실행되지 않으므로, "이미
 * 예약돼 있으면 건너뛴다"는 흔한 스로틀이 예약만 남은 채 영영 풀리지 않는
 * 상태를 만듭니다. 값이 그대로면 React가 리렌더를 건너뛰므로 스로틀 자체가
 * 필요 없습니다.
 *
 * @param threshold 활성화 기준선(px)
 * @param releaseOffset 해제 기준선을 이만큼 위로 내립니다. 단일 기준선이면
 *   경계에서 스크롤이 멈출 때 상태가 떨리고, 전환이 길수록 그 떨림이 그대로
 *   보입니다.
 */
export function useScrolledPast(threshold: number, releaseOffset = 40) {
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const read = () => {
      const y = window.scrollY;
      setScrolledPast((wasPast) =>
        wasPast ? y > threshold - releaseOffset : y > threshold,
      );
    };

    // 새로고침으로 중간 지점에서 시작하는 경우를 맞춘다
    read();

    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, [threshold, releaseOffset]);

  return scrolledPast;
}
