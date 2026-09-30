"use client";

import "./search-hero-tokens.css";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useInView } from "react-intersection-observer";

import { Loader2, Pause, Play } from "@/shared/components/icons/iconsax";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

import styles from "./search-hero.module.css";

// /videos는 30일 캐시라 영상을 바꿀 때는 같은 이름에 덮어쓰지 말고 파일명을 바꾼다.
const VIDEO_SRC = "/videos/bookjeok_search_hero_v3.mp4";
const POSTER_SRC = "/videos/bookjeok_search_hero_v3_poster.jpg";
const END_FRAME_SRC = "/videos/bookjeok_search_hero_v3_end.jpg";
const VIDEO_COMPLETED_KEY = `book-search-video-completed:${VIDEO_SRC}`;
const GRAIN_BACKGROUND = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#grain)"/></svg>',
)}")`;

interface ConnectionLike extends EventTarget {
  saveData?: boolean;
  effectiveType?: string;
}

const getConnection = () =>
  (navigator as Navigator & { connection?: ConnectionLike }).connection;

const shouldSaveData = () => {
  const connection = getConnection();
  return (
    connection?.saveData ||
    ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "")
  );
};

export const SearchHero = ({ children }: { children?: ReactNode }) => {
  const t = useTranslations("book.search");
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref, inView } = useInView({ initialInView: true, threshold: 0 });
  const prefersReducedMotion = usePrefersReducedMotion();
  const inViewRef = useRef(inView);
  inViewRef.current = inView;
  const autoplayRejected = useRef(false);
  const completedRef = useRef(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    // SSR에는 src를 넣지 않는다. 포스터만 보는 사용자에게 영상 요청도 보내지 않는다.
    if (!video.getAttribute("src")) video.src = VIDEO_SRC;
    setIsLoading(true);
    void video.play().then(
      () => {
        if (document.hidden || !inViewRef.current) video.pause();
      },
      (error: unknown) => {
        // 화면 밖으로 나가 pause()한 경우에는 다음 진입 때 다시 재생한다.
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          autoplayRejected.current = true;
        }
        setIsLoading(false);
      },
    );
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(VIDEO_COMPLETED_KEY) === "1") {
        completedRef.current = true;
        setEnded(true);
      }
    } catch {
      // 저장소 접근이 막힌 환경에서도 검색과 영상 재생은 계속 동작한다.
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;

    const syncPlayback = () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (document.hidden || !inView || reduceMotion || shouldSaveData()) {
        video.pause();
        return;
      }
      if (
        video.paused &&
        !video.ended &&
        !completedRef.current &&
        !autoplayRejected.current
      )
        play();
    };

    const connection = getConnection();
    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    connection?.addEventListener("change", syncPlayback);
    return () => {
      video.pause();
      document.removeEventListener("visibilitychange", syncPlayback);
      connection?.removeEventListener("change", syncPlayback);
    };
  }, [failed, inView, play, prefersReducedMotion]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying || isLoading) {
      autoplayRejected.current = true;
      video.pause();
      setIsLoading(false);
      return;
    }
    // 사용자가 직접 누르면 데이터 절약·동작 줄이기 설정에서도 재생할 수 있다.
    autoplayRejected.current = false;
    play();
  };

  const controlLabel = failed
    ? t("hero.unavailable")
    : isPlaying || isLoading
      ? t("hero.pause")
      : t("hero.play");
  const ControlIcon = isLoading ? Loader2 : isPlaying ? Pause : Play;

  return (
    <section ref={ref} className={`search-video-hero ${styles.hero}`}>
      <div className={styles.scene}>
        <Image
          // 이전에 끝까지 본 경우 영상 없이 마지막 장면을 보여 준다.
          src={ended && !hasFrame ? END_FRAME_SRC : POSTER_SRC}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 1024px, 100vw"
          className={styles.poster}
        />
        <video
          ref={videoRef}
          className={styles.video}
          style={{ opacity: hasFrame && !failed ? 1 : 0 }}
          preload="none"
          muted
          playsInline
          disablePictureInPicture
          controls={false}
          aria-hidden="true"
          onPlaying={() => {
            setHasFrame(true);
            setIsPlaying(true);
            setIsLoading(false);
          }}
          onPause={() => {
            setIsPlaying(false);
            setIsLoading(false);
          }}
          onWaiting={() => setIsLoading(true)}
          onEnded={() => {
            completedRef.current = true;
            try {
              sessionStorage.setItem(VIDEO_COMPLETED_KEY, "1");
            } catch {
              // 저장소가 비활성화돼 있어도 현재 화면의 재생 완료 상태는 유지한다.
            }
            setEnded(true);
            setIsPlaying(false);
            setIsLoading(false);
          }}
          onError={() => {
            setFailed(true);
            setIsLoading(false);
            setIsPlaying(false);
          }}
        />
      </div>

      <div className={styles.scrim} aria-hidden="true">
        <div className={styles.dim} />
        <div className={styles.vignette} />
        <div
          className={styles.grain}
          style={{ backgroundImage: GRAIN_BACKGROUND }}
        />
      </div>

      <div className={styles.copy}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
        {children}
      </div>

      {!ended && (
        <button
          type="button"
          onClick={togglePlayback}
          disabled={failed}
          aria-label={controlLabel}
          title={controlLabel}
          className={styles.playback}
        >
          <ControlIcon
            className={isLoading ? styles.spinner : undefined}
            size={16}
            aria-hidden="true"
          />
        </button>
      )}
    </section>
  );
};
