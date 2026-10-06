"use client";

import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { useMarketHeroStats } from "@/features/book-sale/hooks/use-market-hero-stats";
import { ArrowUpRight, ChevronDown } from "@/shared/components/icons/iconsax";
import { AvatarCircles } from "@/shared/components/magicui/avatar-circles";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

const VIDEO_SRC = "/videos/bookjeok_market_video.mp4";
/** 첫 프레임. 즉시 페인트되어 LCP를 잡고, 재생 시작 시 이어지듯 넘어간다. */
const POSTER_SRC = "/videos/bookjeok_market_poster.jpg";

/** 인트로는 세션당 한 번. 재방문에는 8MB를 다시 받지 않고 곧장 카피를 보여준다. */
const SESSION_KEY = "bookjeok.market-hero.played";
/** 메타데이터조차 못 읽는 상황까지 대비한 최후 안전망 */
const HARD_REVEAL_TIMEOUT_MS = 15_000;
/** 리빌 지점을 이만큼 지나도 timeupdate가 오지 않으면 강제로 리빌 */
const REVEAL_GRACE_MS = 3_000;

/** 카피 리빌이 시작되는 재생 지점 */
const COPY_REVEAL_AT = 0.65;
/** 스크림이 덮이기 시작/완료되는 재생 지점 */
const SCRIM_FADE_FROM = 0.55;
const SCRIM_FADE_TO = 0.8;

/** "책 둘러보기"의 스크롤 목적지. book-market-view가 이 id를 단다. */
export const MARKET_LISTINGS_ANCHOR_ID = "market-listings";

/** 리빌 스크림 위에 얹는 미세한 필름 그레인. 이미지 에셋 없이 SVG 노이즈로 생성한다. */
const GRAIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">' +
  '<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />' +
  '<feColorMatrix type="saturate" values="0" /></filter>' +
  '<rect width="100%" height="100%" filter="url(#grain)" /></svg>';
const GRAIN_BACKGROUND_IMAGE = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`;

interface ConnectionLike {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * 인트로 영상을 아예 받지 않아야 하는 상황인지 판단한다.
 * - 동작 줄이기: 10초 자동재생은 WCAG 2.2.2에 걸린다
 * - 데이터 절약/느린 회선: 8MB는 셀룰러 사용자에게 그대로 청구할 비용이 아니다
 * - 같은 세션 재방문: 마켓 탭을 다시 누를 때마다 10초를 보게 할 이유가 없다
 */
const shouldSkipIntro = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return true;

  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return true;
  } catch {
    // 프라이빗 모드 등 sessionStorage 접근 불가. 재생을 막을 이유는 아니다.
  }

  const connection = (navigator as Navigator & { connection?: ConnectionLike })
    .connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  return ["slow-2g", "2g", "3g"].includes(connection.effectiveType ?? "");
};

export const VideoHero = () => {
  const t = useTranslations("market");
  const prefersReducedMotion = usePrefersReducedMotion();

  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** timeupdate는 setState가 반영되기 전에 재진입한다. revealed 상태만으로는 중복을 막지 못한다. */
  const revealedRef = useRef(false);

  const [revealed, setRevealed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  /** 재생 진행률(0~1). 스크림 농도가 여기에 연동된다. timeupdate가 초당 4회라 스프링으로 보간한다. */
  const playProgress = useMotionValue(0);
  const scrimTarget = useTransform(
    playProgress,
    [SCRIM_FADE_FROM, SCRIM_FADE_TO],
    [0, 1],
  );
  const scrimOpacity = useSpring(scrimTarget, { stiffness: 80, damping: 24 });

  const { freshCount, newTodayLabel, regionCount, sellers, hasStats } =
    useMarketHeroStats();

  /**
   * 리빌 공통 처리. fillScrim은 스크림을 즉시 채울지 여부.
   * 재생 중에는 timeupdate가 스크림을 올리므로 false로 호출해야 한다.
   */
  const markRevealed = useCallback(
    (fillScrim: boolean) => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      if (fillScrim) playProgress.set(1);
      setRevealed(true);
    },
    [playProgress],
  );

  /** 재생이 없거나 끝난 경로(스킵·자동재생 차단·에러·안전망·ended)용 */
  const reveal = useCallback(() => markRevealed(true), [markRevealed]);

  const scheduleReveal = useCallback(
    (ms: number) => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      revealTimerRef.current = setTimeout(reveal, ms);
    },
    [reveal],
  );

  useEffect(() => {
    const video = videoRef.current;

    if (!video || shouldSkipIntro()) {
      reveal();
      return;
    }

    let cancelled = false;

    const startIntro = () => {
      if (cancelled) return;

      // SSR에서는 preload="none"으로 내보내고, 재생하기로 결정한 지금 깨운다.
      video.preload = "auto";
      video.play().then(
        () => {
          setIsPlaying(true);
          // 재생이 실제로 시작된 뒤에 기록한다. 먼저 써두면 자동재생이 막혔을 때
          // 보지도 못한 인트로를 "봤다"고 표시해 그 세션 내내 건너뛰게 된다.
          try {
            window.sessionStorage.setItem(SESSION_KEY, "1");
          } catch {
            // 저장 실패는 인트로를 한 번 더 보는 것 외에 영향이 없다.
          }
        },
        () => {
          // 자동재생이 막혔을 뿐 영상 자체는 멀쩡하다. 포스터를 배경 삼아 카피만 노출한다.
          reveal();
        },
      );

      scheduleReveal(HARD_REVEAL_TIMEOUT_MS);
    };

    /**
     * 한 번도 보인 적 없는 탭에서는 재생이 시작되지 않고 play()가 resolve도 reject도 되지 않는다.
     * 이때 안전망 타이머는 백그라운드 스로틀에 걸려 리빌 경로가 전부 멈춘다.
     */
    const onVisible = () => {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", onVisible);
      startIntro();
    };

    if (document.hidden)
      document.addEventListener("visibilitychange", onVisible);
    else startIntro();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, [reveal, scheduleReveal]);

  /**
   * 브라우저는 백그라운드 탭의 재생을 멈춘다. 그대로 두면 ended가 영영 오지 않아
   * 히어로가 카피 없이 굳는다. 돌아왔을 때 이어서 재생시킨다.
   */
  useEffect(() => {
    if (!isPlaying) return;

    const resume = () => {
      const video = videoRef.current;
      if (!video || document.hidden || video.ended || revealed) return;
      void video.play().catch(() => {});
    };

    document.addEventListener("visibilitychange", resume);
    return () => document.removeEventListener("visibilitychange", resume);
  }, [isPlaying, revealed]);

  /**
   * loadedmetadata 시점의 duration은 실제 재생 시작 시각을 반영하지 못한다.
   * 버퍼링으로 재생이 밀리면 리빌 지점보다 타이머가 먼저 만료된다.
   */
  const rearmReveal = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const { duration, currentTime } = video;
    if (!duration || !Number.isFinite(duration)) return;
    const untilReveal = Math.max(0, duration * COPY_REVEAL_AT - currentTime);
    scheduleReveal(untilReveal * 1000 + REVEAL_GRACE_MS);
  }, [scheduleReveal]);

  /** 진행 바와 스크림은 리렌더 없이 갱신한다. (timeupdate는 초당 여러 번 온다) */
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const progress = video.currentTime / video.duration;
    playProgress.set(progress);

    const bar = progressRef.current;
    // Tailwind v4의 scale-* 유틸은 CSS scale 프로퍼티라 transform과 곱해진다. transform만 쓴다.
    if (bar) bar.style.transform = `scaleX(${progress})`;

    // 영상은 계속 재생하고 카피만 먼저 올린다.
    if (progress >= COPY_REVEAL_AT) markRevealed(false);
    else rearmReveal();
  }, [markRevealed, playProgress, rearmReveal]);

  const scrollToListings = useCallback(() => {
    document.getElementById(MARKET_LISTINGS_ANCHOR_ID)?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [prefersReducedMotion]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.09]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -64]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.13,
        delayChildren: prefersReducedMotion ? 0 : 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.35 : 0.75,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  /** 헤드라인/서브카피 전용: overflow-hidden 마스크 안에서 아래→위로 드러나는 리빌. */
  const textRevealVariants: Variants = {
    hidden: { y: prefersReducedMotion ? "0%" : "100%", opacity: 0 },
    visible: {
      y: "0%",
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0.35 : 0.85,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  // 풀블리드 히어로. 음수 마진은 main의 p-4/p-6 + 뷰의 py-8 합이라 둘이 바뀌면 같이 바뀐다.
  return (
    <div className="-mx-4 -mt-12 mb-10 sm:-mx-6 sm:-mt-14 md:mb-14">
      {/*
        폭을 부모에서 확정(w-full)해야 aspect-video가 min-height로부터 폭을 역산하지 않는다.
        (역산되면 좁은 화면에서 460 * 16/9 = 818px짜리 가로 오버플로가 생긴다)
      */}
      <section
        ref={sectionRef}
        className="relative aspect-video min-h-[460px] w-full overflow-hidden bg-neutral-950 sm:min-h-[520px] md:min-h-[600px]"
      >
        <motion.video
          ref={videoRef}
          // scale-* 유틸(CSS scale)을 함께 쓰면 이 값과 곱해진다.
          style={{ scale: prefersReducedMotion ? 1.02 : videoScale }}
          className={`absolute inset-0 h-full w-full object-cover transition-[filter] duration-[1200ms] ease-out ${
            revealed ? "brightness-[0.55] blur-[1.5px] saturate-[0.85]" : ""
          }`}
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          preload="none"
          muted
          playsInline
          disablePictureInPicture
          controls={false}
          aria-hidden="true"
          onLoadedMetadata={rearmReveal}
          onPlaying={rearmReveal}
          onTimeUpdate={handleTimeUpdate}
          onEnded={reveal}
          onError={reveal}
        />

        {/* 재생 진행률. 리빌과 함께 사라진다. */}
        <div
          aria-hidden
          className={`absolute inset-x-0 bottom-0 h-px transition-opacity duration-500 ${
            isPlaying && !revealed ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            ref={progressRef}
            style={{ transform: "scaleX(0)" }}
            className="h-full origin-left bg-white/40 transition-transform duration-150 ease-linear"
          />
        </div>

        {/* 재생 진행률에 연동해 화면 전체가 고르게 어두워진다. */}
        <motion.div
          aria-hidden
          style={{ opacity: scrimOpacity }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />
          {/* 비네트. 네 모서리를 옅게 떨어뜨려 시선을 가운데 카피로 모은다. */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.45)_100%)]" />
          {/* 필름 그레인. overlay 블렌드로 아주 옅게, 평평한 디지털 톤을 깨준다. */}
          <div
            className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
            style={{
              backgroundImage: GRAIN_BACKGROUND_IMAGE,
              backgroundSize: "160px 160px",
            }}
          />
        </motion.div>

        {/*
          카피는 항상 DOM에 둔다. 조건부 렌더로 감추면 h1이 서버 HTML에서 사라져
          크롤러와 스크린리더가 페이지 주제어를 놓친다. 보이고 감추는 건 애니메이션으로만 제어.
        */}
        <motion.div
          style={
            prefersReducedMotion
              ? undefined
              : { y: copyY, opacity: copyOpacity }
          }
          className="absolute inset-0"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={revealed ? "visible" : "hidden"}
            className={`flex h-full flex-col items-center justify-center px-6 py-10 text-center ${
              revealed ? "" : "pointer-events-none"
            }`}
          >
            {/*
              간격은 균일하게 두지 않는다. 헤드라인↔서브는 한 덩어리로 붙이고,
              지표/CTA 앞에서 크게 벌려 "카피 / 근거 / 행동" 세 그룹으로 읽히게 한다.
            */}
            <div className="overflow-hidden">
              <motion.h1
                variants={textRevealVariants}
                className="break-keep font-(family-name:--font-gowun-batang) text-[1.9rem] leading-[1.18] text-white sm:text-[2.5rem] md:text-[3.1rem] lg:text-[3.6rem]"
              >
                {t("videoHero.title")}
              </motion.h1>
            </div>

            <div className="mt-3 overflow-hidden sm:mt-4">
              <motion.p
                variants={textRevealVariants}
                className="max-w-sm break-keep text-[15px] leading-relaxed text-neutral-200 sm:max-w-md sm:text-[16px] lg:text-[17px]"
              >
                {t("videoHero.subtitle")}
              </motion.p>
            </div>

            {hasStats && (
              <motion.div
                variants={itemVariants}
                className="mt-9 flex w-full max-w-lg flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-white/15 pt-6 sm:mt-11"
              >
                {freshCount > 0 && (
                  <StatCell
                    value={newTodayLabel}
                    label={t("hero.stats.new_listings")}
                  />
                )}
                {regionCount > 0 && (
                  <StatCell
                    value={String(regionCount)}
                    label={t("hero.stats.regions")}
                  />
                )}
                {sellers.length > 0 && (
                  <div className="flex flex-col items-center gap-2">
                    <AvatarCircles
                      avatars={sellers.slice(0, 4)}
                      extraCount={Math.max(0, sellers.length - 4)}
                      size="sm"
                      className="[&>div]:h-6 [&>div]:w-6 [&>div]:border-black/50"
                    />
                    <span className="text-[11px] tracking-tight text-neutral-300">
                      {t("hero.stats.sellers")}
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-9"
            >
              <Link
                href={PATHS.BOOK_SALES_REGISTER}
                // 리빌 전에는 보이지 않으므로 탭 순서에서도 빼둔다.
                tabIndex={revealed ? undefined : -1}
                // 투명 테두리가 없으면 고스트 버튼보다 2px 낮다.
                className="group inline-flex items-center gap-2.5 rounded-full border border-transparent bg-white px-6 py-3.5 text-sm font-medium text-neutral-950 shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-100 hover:shadow-[0_10px_36px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {t("hero.cta_sell")}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>

              <button
                type="button"
                onClick={scrollToListings}
                tabIndex={revealed ? undefined : -1}
                className="inline-flex items-center rounded-full border border-white/35 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {t("hero.cta_browse")}
              </button>
            </motion.div>
          </motion.div>

          {/* 스크롤 신호. 리빌 후 노출되고 스크롤하면 카피와 함께 사라진다. */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: revealed ? 1 : 0 }}
            transition={{
              duration: 0.6,
              delay: revealed && !prefersReducedMotion ? 1.6 : 0,
            }}
            className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center"
          >
            <motion.div
              animate={prefersReducedMotion ? undefined : { y: [0, 6, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ChevronDown className="h-5 w-5 text-white/45" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
};

const StatCell = ({ value, label }: { value: string; label: string }) => (
  <div>
    {/* 지난 하루 등록 수는 Date.now() 기준이라 ISR 생성 시각과 조회 시각이 다르면 어긋난다. */}
    <span
      suppressHydrationWarning
      className="block font-(family-name:--font-gowun-batang) text-xl leading-none tabular-nums text-white sm:text-2xl"
    >
      {value}
    </span>
    <span className="mt-2 block text-[11px] tracking-tight text-neutral-300">
      {label}
    </span>
  </div>
);
