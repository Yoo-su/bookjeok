import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { cn } from "@/shared/utils/cn";

/**
 * 메인 슬라이더 로딩 스켈레톤입니다.
 * 치수는 getSliderDimensions와 같은 구간을 CSS 변수로 분기해 서버 HTML부터 맞춥니다.
 */
const DIMENSION_CLASS =
  "[--r:350px] [--w:110px] [--h:165px] min-[481px]:[--r:420px] min-[481px]:[--w:130px] min-[481px]:[--h:195px] min-[769px]:[--r:480px] min-[769px]:[--w:150px] min-[769px]:[--h:225px] min-[1025px]:[--r:580px] min-[1025px]:[--w:180px] min-[1025px]:[--h:270px]";

export const BookSliderSkeleton = () => {
  // MainBookSlider와 동일하게 18개 도서 기준 20도 각도로 배치
  const CARD_COUNT = 18;
  const ANGLE_STEP = 360 / CARD_COUNT; // 20도

  return (
    <div
      className={cn(
        "w-full flex flex-col items-center select-none pointer-events-none",
        DIMENSION_CLASS,
      )}
    >
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
            transform: "translateZ(calc(var(--r) * -1))", // 3D 원근법 확대 왜곡을 보정하기 위해 좌표축 공간을 뒤로 이동
            width: "var(--w)",
            height: "var(--h)",
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
                  transform: `rotateY(${angle}deg) translateZ(var(--r))`,
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
