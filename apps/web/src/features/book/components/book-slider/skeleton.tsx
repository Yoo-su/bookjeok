"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/shared/components/shadcn/skeleton";

interface BookSliderSkeletonProps {
  radius?: number;
  cardWidth?: number;
  cardHeight?: number;
}

// 화면 너비별 반응형 치수 계산 헬퍼 함수
const getSliderDimensions = (width?: number) => {
  const w =
    width ?? (typeof window !== "undefined" ? window.innerWidth : 1200);
  if (w > 1024) {
    return { radius: 580, cardWidth: 180, cardHeight: 270 };
  } else if (w > 768) {
    return { radius: 480, cardWidth: 150, cardHeight: 225 };
  } else if (w > 480) {
    return { radius: 420, cardWidth: 130, cardHeight: 195 };
  } else {
    return { radius: 350, cardWidth: 110, cardHeight: 165 };
  }
};

export const BookSliderSkeleton = ({
  radius: propRadius,
  cardWidth: propCardWidth,
  cardHeight: propCardHeight,
}: BookSliderSkeletonProps = {}) => {
  // 화면 크기별 반응형 파라미터 (클라이언트 마운트 시 즉시 현재 창 크기 반영)
  const defaultDimensions = getSliderDimensions();
  const [dimensions, setDimensions] = useState(() => ({
    radius: propRadius ?? defaultDimensions.radius,
    cardWidth: propCardWidth ?? defaultDimensions.cardWidth,
    cardHeight: propCardHeight ?? defaultDimensions.cardHeight,
  }));

  useEffect(() => {
    if (propRadius && propCardWidth && propCardHeight) {
      setDimensions({
        radius: propRadius,
        cardWidth: propCardWidth,
        cardHeight: propCardHeight,
      });
      return;
    }

    const handleResize = () => {
      setDimensions(getSliderDimensions(window.innerWidth));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [propRadius, propCardWidth, propCardHeight]);

  const activeRadius = propRadius ?? dimensions.radius;
  const activeCardWidth = propCardWidth ?? dimensions.cardWidth;
  const activeCardHeight = propCardHeight ?? dimensions.cardHeight;

  // MainBookSlider와 동일하게 18개 도서 기준 20도 각도로 배치
  const CARD_COUNT = 18;
  const ANGLE_STEP = 360 / CARD_COUNT; // 20도

  return (
    <div className="w-full flex flex-col items-center select-none pointer-events-none">
      <div
        style={{
          perspective: 1200,
          perspectiveOrigin: "center 30%",
        }}
        className="relative flex items-center justify-center w-full h-[220px] sm:h-[260px] md:h-[310px] lg:h-[360px] overflow-visible"
      >
        <div
          style={{
            transformStyle: "preserve-3d",
            transform: `translateZ(-${activeRadius}px)`, // 3D 원근법 확대 왜곡을 보정하기 위해 좌표축 공간을 뒤로 이동
            width: activeCardWidth,
            height: activeCardHeight,
          }}
          className="relative"
        >
          {[...Array(CARD_COUNT)].map((_, i) => {
            const angle = i * ANGLE_STEP;
            const total = ((angle % 360) + 360) % 360;
            const relativeAngle = total > 180 ? total - 360 : total;
            const absAngle = Math.abs(relativeAngle);

            // 실제 슬라이더와 정확히 일치하는 크기 및 투명도 계산
            let scale = 0.65;
            let opacity = 0.15;

            if (absAngle <= 60) {
              const t = absAngle / 60;
              scale = 1.05 - t * 0.15;
              opacity = 1.0 - t * 0.4;
            } else if (absAngle <= 120) {
              const t = (absAngle - 60) / 60;
              scale = 0.9 - t * 0.15;
              opacity = 0.6 - t * 0.35;
            } else {
              const t = (absAngle - 120) / 60;
              scale = 0.75 - t * 0.1;
              opacity = 0.25 - t * 0.1;
            }

            const zIndex = Math.round(200 - absAngle);

            // 후면 카드(90도 초과)는 MainBookSlider와 동일하게 표시하지 않음
            if (absAngle > 85) return null;

            return (
              // 외곽 레이어: 정적 3D 실린더 배치 담당 및 후면 숨김 처리
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  transformStyle: "preserve-3d",
                  transform: `rotateY(${angle}deg) translateZ(${activeRadius}px)`,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                {/* 내부 레이어: 동적 크기, 투명도 스타일링 */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    transform: `scale(${scale})`,
                    transformStyle: "preserve-3d",
                    opacity: Math.max(0, opacity),
                    zIndex,
                  }}
                  className="rounded-2xl bg-stone-100/50 border border-stone-200/40 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)] w-full h-full overflow-hidden"
                >
                  <Skeleton className="w-full h-full bg-stone-200/50 rounded-2xl animate-pulse" />
                </div>
              </div>
            );
          })}
        </div>

        {/* 바닥 그림자 */}
        <div className="absolute bottom-[-35px] left-1/2 -translate-x-1/2 w-[85%] h-[35px] bg-stone-900/10 rounded-full blur-2xl -z-10 pointer-events-none" />
      </div>

      {/* 활성 도서 정보 텍스트 영역 스켈레톤 */}
      <div className="container mx-auto mt-16 flex flex-col items-center text-center h-[80px]">
        <div className="space-y-1.5 flex flex-col items-center">
          <Skeleton className="h-[25px] md:h-[36px] w-48 md:w-64 bg-stone-200/60 rounded-lg animate-pulse" />
          <Skeleton className="h-[20px] md:h-[24px] w-32 md:w-40 bg-stone-200/40 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
};
