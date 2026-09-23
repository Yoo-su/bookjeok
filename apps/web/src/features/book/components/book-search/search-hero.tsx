"use client";

import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { useInView } from "react-intersection-observer";

import { cn } from "@/shared/utils/cn";

// 애니메이션은 globals.css의 CSS 키프레임 전담 (JS 프레임 루프는 iOS Safari 입력 지연 유발)
const PARTICLE_COUNT = 35;
const VIEWBOX_WIDTH = 800;
const VIEWBOX_HEIGHT = 220;

// viewBox 단위 → cqw 환산
const unit = (v: number) => `${(v / VIEWBOX_WIDTH) * 100}cqw`;

// 서버·클라이언트가 같은 입자를 그리도록 시드 고정 난수 사용
const createRandom = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const random = createRandom(20260923);
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
  id,
  x: random() * VIEWBOX_WIDTH,
  y: 80 + random() * 60, // 강물 흐름 근처
  r: random() < 0.2 ? 2 : 1 + random() * 0.5, // 가끔 큰 별
  peak: 0.3 + random() * 0.5,
  drift: 15 + random() * 20,
  twinkle: 3 + random() * 2,
  delay: random() * 5,
}));

export const SearchHero = () => {
  const t = useTranslations("book.search");

  // 화면 밖에서는 애니메이션 정지
  const { ref, inView } = useInView({ initialInView: true });

  return (
    <section
      ref={ref}
      data-paused={inView ? undefined : ""}
      className="search-hero relative w-full py-16 sm:py-18 flex flex-col items-center justify-center overflow-hidden bg-white select-none"
    >
      {/* 1. 배경 오브 (blur 필터 대신 방사형 그라데이션) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="search-hero-orb-a absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(closest-side,var(--color-slate-100),transparent)]" />
        <div className="search-hero-orb-b absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(closest-side,var(--color-indigo-50),transparent)]" />
      </div>

      {/* 2. 메인 씬 */}
      <div className="relative z-10 w-full px-6 flex flex-col items-center">
        <div className="relative w-full h-[220px] mb-8 flex items-center justify-center pointer-events-none">
          {/* SVG meet 스케일과 같은 800×220 장면 */}
          <div
            className="@container relative w-full max-w-[800px]"
            style={{ aspectRatio: `${VIEWBOX_WIDTH} / ${VIEWBOX_HEIGHT}` }}
          >
            <svg
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
              className="absolute inset-0 w-full h-full overflow-visible"
              aria-hidden="true"
            >
              {/* 강물 흐름선 */}
              <path
                d="M -100,100 C 200,80 500,120 900,100"
                fill="none"
                stroke="url(#star-gradient-1)"
                strokeWidth="0.5"
                className="search-hero-fade"
                style={
                  { "--to": 0.6, animationDuration: "2s" } as CSSProperties
                }
              />
              <path
                d="M -100,120 C 300,140 600,80 900,110"
                fill="none"
                stroke="url(#star-gradient-2)"
                strokeWidth="0.5"
                className="search-hero-fade"
                style={
                  { "--to": 0.4, animationDuration: "2.5s" } as CSSProperties
                }
              />

              <defs>
                <linearGradient
                  id="star-gradient-1"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0" />
                  <stop offset="50%" stopColor="#64748b" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                  id="star-gradient-2"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity="0" />
                  <stop offset="50%" stopColor="#475569" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* 별 입자 (바깥: 흐름, 안쪽: 반짝임) */}
            {PARTICLES.map((p) => (
              <span
                key={p.id}
                className="search-hero-drift absolute"
                style={
                  {
                    left: unit(p.x),
                    top: unit(p.y),
                    "--drift": `${p.drift}s`,
                    "--delay": `${p.delay}s`,
                  } as CSSProperties
                }
              >
                <span
                  className="search-hero-twinkle block rounded-full bg-slate-600"
                  style={
                    {
                      width: unit(p.r * 2),
                      height: unit(p.r * 2),
                      margin: `-${unit(p.r)} 0 0 -${unit(p.r)}`,
                      "--peak": p.peak,
                      "--twinkle": `${p.twinkle}s`,
                      "--delay": `${p.delay}s`,
                    } as CSSProperties
                  }
                />
              </span>
            ))}

            {/* 투명한 돋보기 (backdrop-filter 없이) */}
            <div
              className="search-hero-lens absolute left-0 top-0 rounded-full"
              style={{
                width: unit(96),
                height: unit(96),
                background: "rgba(255, 255, 255, 0.5)",
                boxShadow:
                  "0 10px 40px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.6)",
              }}
            >
              <div className="absolute inset-[4%] rounded-full border border-white/30" />
              <div className="absolute top-[12%] left-[16%] w-1/3 h-1/6 rounded-full bg-linear-to-br from-white/80 to-transparent opacity-60 rotate-[-15deg]" />
              <div className="absolute bottom-[12%] right-[16%] w-1/4 h-1/4 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.3),transparent)]" />
            </div>
          </div>
        </div>

        {/* Text Reveal */}
        <div className="text-center space-y-4">
          <h1
            className={cn(
              "search-hero-title font-(family-name:--font-pretendard) text-5xl md:text-6xl font-light tracking-tight text-slate-800",
            )}
          >
            {t("title")}
          </h1>

          <div className="search-hero-subtitle flex items-center justify-center gap-4 text-slate-400">
            <span className="w-16 h-px bg-slate-200" />
            <span className="text-xs font-semibold tracking-[0.3em] uppercase">
              {t("subtitle")}
            </span>
            <span className="w-16 h-px bg-slate-200" />
          </div>
        </div>
      </div>
    </section>
  );
};
