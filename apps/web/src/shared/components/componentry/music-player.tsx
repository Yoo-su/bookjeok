"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import React, { useEffect, useRef, useState } from "react";

import { cn } from "@/shared/utils";

export interface MusicPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The source URL of the audio file or YouTube video */
  src: string;
  /** The URL of the album cover image */
  coverArt: string;
  /** Whether to auto-play the audio when loaded */
  autoPlay?: boolean;
  /** Controlled playing state */
  isPlaying?: boolean;
  /** Callback when user clicks the vinyl to toggle playback */
  onTogglePlay?: () => void;
  /** Disable internal audio/iframe engine (when using global persistent host) */
  disableInternalAudio?: boolean;
}

export function MusicPlayer({
  className,
  src,
  coverArt,
  autoPlay = false,
  isPlaying: controlledIsPlaying,
  onTogglePlay,
  disableInternalAudio = false,
  ...props
}: MusicPlayerProps) {
  const t = useTranslations("music.controls");
  const [internalIsPlaying, setInternalIsPlaying] = useState(autoPlay);
  const isPlaying =
    controlledIsPlaying !== undefined ? controlledIsPlaying : internalIsPlaying;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Extract YouTube ID if it's a YouTube URL
  const getYoutubeId = (url: string) => {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/,
    );
    return match ? match[1] : null;
  };

  const youtubeId = src ? getYoutubeId(src) : null;

  useEffect(() => {
    if (disableInternalAudio) return;

    if (isPlaying) {
      if (youtubeId && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "playVideo", args: [] }),
          "*",
        );
      } else {
        audioRef.current?.play().catch(() => setInternalIsPlaying(false));
      }
    } else {
      if (youtubeId && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
          "*",
        );
      } else {
        audioRef.current?.pause();
      }
    }
  }, [isPlaying, youtubeId, disableInternalAudio]);

  const handleToggle = () => {
    if (onTogglePlay) {
      onTogglePlay();
    } else {
      setInternalIsPlaying(!internalIsPlaying);
    }
  };

  return (
    <div
      className={cn("relative inline-flex flex-col items-center", className)}
      {...props}
    >
      {!disableInternalAudio && (
        <>
          {youtubeId ? (
            <iframe
              ref={iframeRef}
              className="pointer-events-none fixed -left-[9999px] -top-[9999px] h-1 w-1 opacity-0"
              src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=${
                autoPlay ? 1 : 0
              }&controls=0`}
              allow="autoplay"
              title="Music Player Audio"
            />
          ) : (
            <audio
              ref={audioRef}
              src={src}
              onEnded={() => {
                if (onTogglePlay && isPlaying) onTogglePlay();
                else setInternalIsPlaying(false);
              }}
              className="hidden"
            />
          )}
        </>
      )}

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        className="relative h-64 w-64 cursor-pointer select-none md:h-80 md:w-80 outline-none focus-visible:ring-4 focus-visible:ring-stone-400 focus-visible:ring-offset-4 rounded-full"
        title={isPlaying ? t("pause") : t("play")}
        aria-label={isPlaying ? t("pause") : t("play")}
      >
        {/* Tonearm with spring physics */}
        <motion.div
          className="pointer-events-none absolute right-[-10%] top-[-5%] z-20 h-[15%] w-[60%] origin-top-right sm:right-[-15%] sm:top-[-8%]"
          initial={{ rotate: 12 }}
          animate={{ rotate: isPlaying ? -22 : 12 }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 24,
            mass: 0.8,
          }}
        >
          {/* Tonearm base */}
          <div className="absolute right-0 top-0 z-10 h-8 w-8 -translate-y-1/2 translate-x-1/2 transform rounded-full border-4 border-zinc-200 bg-zinc-400 shadow-md md:h-10 md:w-10 dark:border-zinc-800 dark:bg-zinc-600" />
          {/* Tonearm stick & Needle */}
          <div className="absolute right-[10px] top-0 flex h-2 w-[90%] origin-right -rotate-12 items-center justify-start rounded-full bg-zinc-400 shadow-xs sm:right-[15px] md:h-3 dark:bg-zinc-500">
            {/* Needle */}
            <div className="h-4 w-4 -translate-x-1/2 transform rounded-full bg-zinc-800 shadow-md md:h-5 md:w-5 dark:bg-zinc-300" />
          </div>
        </motion.div>

        {/* Record Disc */}
        <div
          className={cn(
            "relative h-full w-full overflow-hidden rounded-full border-4 border-black/10 bg-black shadow-xl shadow-black/30 sm:border-8 dark:border-white/10",
          )}
          style={{
            animation: "spin 4s linear infinite",
            animationPlayState: isPlaying ? "running" : "paused",
          }}
        >
          {/* Album Cover Background with smooth crossfade */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={coverArt}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${coverArt})` }}
            />
          </AnimatePresence>

          {/* Grooves Overlay */}
          <div
            className="absolute inset-0 rounded-full border border-black/20"
            style={{
              background:
                "radial-gradient(circle, transparent 20%, rgba(0,0,0,0.4) 21%, transparent 22%, transparent 35%, rgba(0,0,0,0.5) 36%, transparent 37%, transparent 50%, rgba(0,0,0,0.3) 51%, transparent 52%, transparent 65%, rgba(0,0,0,0.6) 66%, transparent 67%, transparent 80%, rgba(0,0,0,0.4) 81%, transparent 82%)",
            }}
          />

          {/* Glare effect */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.2) 100%)",
            }}
          />

          {/* Center Hole and Label Area */}
          <div className="absolute left-1/2 top-1/2 flex h-1/3 w-1/3 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 shadow-inner">
            {/* The center pin hole */}
            <div className="h-3 w-3 rounded-full border border-black/40 bg-zinc-300 shadow-inner md:h-4 md:w-4 dark:bg-zinc-600" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
