"use client";

import { Review } from "@bookjeok/core";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";
import { cn } from "@/shared/utils/cn";

import { ReviewRow } from "./review-row";

/** 한 번에 보이는 행 수 */
const VISIBLE_COUNT = 5;

/** 한 줄이 올라가는 간격(ms) */
const ROTATE_INTERVAL_MS = 4000;

/** 한 줄이 올라가는 데 걸리는 시간(초) */
const SLIDE_DURATION_S = 0.62;

interface ReviewTickerProps {
  reviews: Review[];
}

/**
 * 최신 리뷰를 한 줄씩 위로 밀어 올리는 티커입니다.
 *
 * 보이는 줄보다 한 줄 더 그려 두고 목록 전체를 한 줄 높이만큼 올린 뒤, 전환이
 * 끝나면 시작 위치를 한 칸 옮기고 이동량을 0으로 되돌립니다. 그래서 어느
 * 순간에도 뷰포트 높이가 변하지 않습니다 — 행을 흐름에서 빼는 방식은 컨테이너가
 * 한 줄만큼 줄었다 늘며 아래 광고·푸터까지 같이 들썩입니다.
 *
 * 행 높이는 표지 썸네일이 정하고 `sm`에서 한 번 바뀌므로, 화면이 바뀔 때마다
 * 실측합니다. 실측 전(그리고 JS가 없을 때)에는 잘라내기 없이 상위 5건을 그대로
 * 그리므로 서버가 구운 HTML과 첫 클라이언트 렌더가 일치합니다.
 */
export const ReviewTicker = ({ reviews }: ReviewTickerProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rowRef = useRef<HTMLDivElement>(null);

  const [rowHeight, setRowHeight] = useState(0);
  const [offset, setOffset] = useState(0);
  // 0 = 멈춘 상태, 1 = 한 줄 올라간 상태
  const [phase, setPhase] = useState<0 | 1>(0);
  const [isPaused, setIsPaused] = useState(false);

  const total = reviews.length;
  const canRotate = total > VISIBLE_COUNT && rowHeight > 0;
  const isTicking = canRotate && !prefersReducedMotion;

  // 행 자체는 전환 중에도 높이가 변하지 않으므로 애니메이션과 무관하게 잰다
  useEffect(() => {
    const measure = () => {
      const node = rowRef.current;
      if (node) setRowHeight(node.offsetHeight);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!isTicking || isPaused) return;

    const timer = setInterval(() => {
      // 백그라운드 탭에서는 넘기지 않는다. 돌아왔을 때 몇 건이 통째로
      // 지나가 있는 것보다 멈춰 있던 편이 낫다
      if (document.visibilityState === "hidden") return;
      setPhase(1);
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isTicking, isPaused]);

  // 목록이 바뀌면(리페치) 시작 위치를 되돌려 범위를 벗어나지 않게 한다
  useEffect(() => {
    setOffset(0);
    setPhase(0);
  }, [total]);

  // 보이는 줄보다 하나 더. 마지막 한 줄이 아래에서 올라오는 줄이다
  const windowSize = isTicking
    ? Math.min(VISIBLE_COUNT + 1, total)
    : Math.min(VISIBLE_COUNT, total);

  const windowRows = useMemo(
    () =>
      Array.from(
        { length: windowSize },
        (_, i) => reviews[(offset + i) % total],
      ),
    [reviews, offset, total, windowSize],
  );

  return (
    <div
      className={cn(
        "border-t border-stone-200/80",
        isTicking && "overflow-hidden",
      )}
      style={isTicking ? { height: rowHeight * VISIBLE_COUNT } : undefined}
      // 읽는 중에 줄이 사라지지 않도록 멈춘다. 포커스까지 보는 이유는 키보드로
      // 3번째 줄에 들어간 사용자가 그 줄과 함께 포커스를 잃기 때문이다
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setIsPaused(false);
        }
      }}
    >
      <motion.div
        animate={{ y: isTicking ? -rowHeight * phase : 0 }}
        transition={
          phase === 1
            ? { duration: SLIDE_DURATION_S, ease: [0.22, 1, 0.36, 1] }
            : { duration: 0 }
        }
        onAnimationComplete={() => {
          // 되돌리기(phase 0)도 완료 콜백을 부르므로 올라간 경우만 받는다
          if (phase !== 1) return;
          setOffset((current) => (current + 1) % total);
          setPhase(0);
        }}
      >
        {windowRows.map((review, index) => (
          <div key={review.id} ref={index === 0 ? rowRef : undefined}>
            <ReviewRow review={review} />
          </div>
        ))}
      </motion.div>
    </div>
  );
};
