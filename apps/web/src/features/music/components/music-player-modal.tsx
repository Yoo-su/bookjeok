"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { MusicPlayer } from "@/shared/components/componentry/music-player";
import {
  Disc3,
  Pause,
  Play,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "@/shared/components/icons/iconsax";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";

import { useMusicStore } from "../stores/use-music-store";

export function MusicPlayerModal() {
  const t = useTranslations("music");
  const isModalOpen = useMusicStore((state) => state.isModalOpen);
  const setIsModalOpen = useMusicStore((state) => state.setIsModalOpen);
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const togglePlay = useMusicStore((state) => state.togglePlay);
  const playlist = useMusicStore((state) => state.playlist);
  const currentIndex = useMusicStore((state) => state.currentIndex);
  const repeatMode = useMusicStore((state) => state.repeatMode);
  const cycleRepeatMode = useMusicStore((state) => state.cycleRepeatMode);
  const playNext = useMusicStore((state) => state.playNext);
  const playPrev = useMusicStore((state) => state.playPrev);
  const volume = useMusicStore((state) => state.volume);
  const setVolume = useMusicStore((state) => state.setVolume);

  const currentTrack = playlist[currentIndex] || playlist[0];

  if (!currentTrack) return null;

  const trackTitle = currentTrack.title;
  const trackArtist = currentTrack.artist;

  const getRepeatTitle = () => {
    if (repeatMode === "all") return t("controls.repeat_all");
    if (repeatMode === "one") return t("controls.repeat_one");
    return t("controls.repeat_off");
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl border border-stone-200/90 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <DialogHeader className="flex flex-row items-center justify-between pr-10 pb-2">
          <div className="flex items-center gap-2">
            <Disc3
              className={`h-5 w-5 text-stone-900 ${isPlaying ? "animate-spin" : ""}`}
              style={{ animationDuration: "3s" }}
            />
            <DialogTitle className="sr-only">{t("title")}</DialogTitle>
            {playlist.length > 1 && (
              <span className="ml-1 rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-stone-600">
                {currentIndex + 1} / {playlist.length}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* LP 턴테이블 메인 플레이어 */}
        <div className="flex flex-col items-center justify-center py-4">
          <MusicPlayer
            src={currentTrack.src}
            coverArt={currentTrack.coverArt}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            disableInternalAudio={true}
          />

          {/* 트랙 정보 (Framer Motion 부드러운 텍스트 슬라이드/크로스페이드) */}
          <div className="mt-6 min-h-[52px] text-center flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTrack.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <h3 className="font-serif text-lg font-bold tracking-tight text-stone-900">
                  {trackTitle}
                </h3>
                <p className="mt-1 text-xs font-medium text-stone-500">
                  {trackArtist}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 컨트롤 바 */}
          <div className="mt-6 flex w-full flex-col gap-4 border-t border-stone-100 pt-5">
            {/* 이전곡, 재생/정지, 다음곡, 반복재생 버튼 */}
            <div className="flex items-center justify-center gap-4">
              {/* 반복 재생 토글 버튼 with 탄성 피드백 */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                type="button"
                onClick={cycleRepeatMode}
                className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  repeatMode !== "off"
                    ? "bg-stone-100 text-stone-900 hover:bg-stone-200"
                    : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                }`}
                title={getRepeatTitle()}
                aria-label={getRepeatTitle()}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={repeatMode}
                    initial={{ scale: 0.7, rotate: -15, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0.7, rotate: 15, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center"
                  >
                    {repeatMode === "one" ? (
                      <Repeat1 className="h-4.5 w-4.5" />
                    ) : (
                      <Repeat className="h-4.5 w-4.5" />
                    )}
                  </motion.span>
                </AnimatePresence>
                {repeatMode !== "off" && (
                  <motion.span
                    layoutId="repeat-indicator-dot"
                    className="absolute bottom-1 h-1 w-1 rounded-full bg-stone-900"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>

              {/* 이전 곡 버튼 with 탭 바운스 */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                type="button"
                onClick={playPrev}
                className="flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-950"
                title={t("controls.prev")}
                aria-label={t("controls.prev")}
              >
                <SkipBack variant="bold" className="h-5 w-5" />
              </motion.button>

              {/* 재생 / 일시정지 메인 버튼 with 아이콘 모핑 & 스프링 탭 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                type="button"
                onClick={togglePlay}
                className="flex h-13 w-13 items-center justify-center rounded-full bg-stone-900 text-white shadow-md transition-colors hover:bg-stone-800"
                aria-label={
                  isPlaying ? t("controls.pause") : t("controls.play")
                }
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={isPlaying ? "pause" : "play"}
                    initial={{
                      scale: 0.5,
                      rotate: isPlaying ? -45 : 45,
                      opacity: 0,
                    }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{
                      scale: 0.5,
                      rotate: isPlaying ? 45 : -45,
                      opacity: 0,
                    }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="flex items-center justify-center"
                  >
                    {isPlaying ? (
                      <Pause variant="bold" className="h-6 w-6" />
                    ) : (
                      <Play variant="bold" className="ml-0.5 h-6 w-6" />
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              {/* 다음 곡 버튼 with 탭 바운스 */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                type="button"
                onClick={playNext}
                className="flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-950"
                title={t("controls.next")}
                aria-label={t("controls.next")}
              >
                <SkipForward variant="bold" className="h-5 w-5" />
              </motion.button>
            </div>

            {/* 볼륨 컨트롤 */}
            <div className="flex items-center justify-center gap-2.5 px-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setVolume(volume > 0 ? 0 : 80)}
                className="text-stone-400 transition-colors hover:text-stone-700 cursor-pointer"
                title={volume === 0 ? t("controls.unmute") : t("controls.mute")}
                aria-label={
                  volume === 0 ? t("controls.unmute") : t("controls.mute")
                }
              >
                {volume === 0 ? (
                  <VolumeX className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                )}
              </motion.button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                aria-label={t("controls.volume")}
                aria-valuenow={volume}
                aria-valuemin={0}
                aria-valuemax={100}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="h-1.5 w-40 cursor-pointer appearance-none rounded-full bg-stone-200 accent-stone-900"
              />
              <span className="w-6 font-mono text-[10px] text-stone-400">
                {volume}%
              </span>
            </div>
          </div>
        </div>

        {/* 닫기 안내 문구 */}
        <div className="border-t border-stone-100 pt-3 text-center">
          <p className="text-[11px] text-stone-400">{t("tip")}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
