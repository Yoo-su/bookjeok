"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Disc3, Pause, Play } from "@/shared/components/icons/iconsax";
import { cn } from "@/shared/utils/cn";

import { useMusicStore } from "../stores/use-music-store";

interface HeaderMusicButtonProps {
  compact?: boolean;
}

export function HeaderMusicButton({ compact = false }: HeaderMusicButtonProps) {
  const t = useTranslations("music");
  const [mounted, setMounted] = useState(false);
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const togglePlay = useMusicStore((state) => state.togglePlay);
  const toggleModal = useMusicStore((state) => state.toggleModal);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-8.5 rounded-full bg-stone-100/50",
          compact ? "w-8.5" : "w-21",
        )}
      />
    );
  }

  return (
    <div className="relative flex items-center shrink-0">
      <motion.div
        whileTap={{ scale: 0.96 }}
        role="button"
        tabIndex={0}
        onClick={toggleModal}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              toggleModal();
            }
          }
        }}
        className={cn(
          "group relative flex h-8.5 items-center rounded-full border whitespace-nowrap shrink-0 transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-stone-400",
          compact ? "w-8.5 justify-center px-0" : "w-21 justify-between px-2.5",
          isPlaying
            ? "border-stone-300 bg-stone-100/70 text-stone-900 shadow-2xs"
            : "border-stone-200/90 bg-white/90 text-stone-600 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900",
        )}
        title={t("header_button.title")}
        aria-label={t("header_button.aria_label")}
      >
        {/* 미니 바이닐 디스크 (재생 중일 때만 부드럽게 회전) */}
        <Disc3
          className={`h-4 w-4 shrink-0 transition-all duration-300 ${
            isPlaying
              ? "animate-spin text-stone-900"
              : "text-stone-400 group-hover:text-stone-700"
          }`}
          style={{ animationDuration: "3s" }}
          aria-hidden="true"
        />

        {!compact && (
          <>
            {/* 고정 텍스트 (재생 상태가 바뀌어도 폭 고정) */}
            <span className="font-mono text-[11px] font-semibold tracking-tight text-stone-700 select-none">
              {t("header_button.label")}
            </span>

            {/* 원클릭 퀵 재생/정지 버튼 with 마이크로 탭 바운스 */}
            <motion.span
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  togglePlay();
                }
              }}
              className={`flex h-4.5 w-4.5 items-center justify-center rounded-full transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-stone-600 ${
                isPlaying
                  ? "bg-stone-800 text-white hover:bg-stone-950"
                  : "bg-stone-200/70 text-stone-600 hover:bg-stone-300 hover:text-stone-900"
              }`}
              title={isPlaying ? t("controls.pause") : t("controls.play")}
              aria-label={isPlaying ? t("controls.pause") : t("controls.play")}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={isPlaying ? "header-pause" : "header-play"}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="flex items-center justify-center"
                >
                  {isPlaying ? (
                    <Pause
                      variant="bold"
                      className="h-2 w-2"
                      aria-hidden="true"
                    />
                  ) : (
                    <Play
                      variant="bold"
                      className="ml-0.5 h-2 w-2"
                      aria-hidden="true"
                    />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          </>
        )}
      </motion.div>
    </div>
  );
}
