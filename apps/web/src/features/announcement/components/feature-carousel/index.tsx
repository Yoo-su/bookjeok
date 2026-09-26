"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { type KeyboardEvent, type ReactNode, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";
import { cn } from "@/shared/utils";

export interface FeatureSlide {
  id: string;
  /** 위쪽 그림 영역. 슬라이드가 보일 때만 마운트되므로 들어올 때마다 애니메이션이 다시 돈다 */
  visual: ReactNode;
  title: ReactNode;
  body: ReactNode;
}

interface FeatureCarouselProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slides: FeatureSlide[];
  /** 마지막 장의 주 버튼 */
  finalAction: ReactNode;
}

const SWIPE_PX = 56;

/** 새 기능을 넘겨 가며 소개하는 모달. 스와이프·화살표 키·점으로 옮긴다 */
export function FeatureCarousel({
  open,
  onOpenChange,
  slides,
  finalAction,
}: FeatureCarouselProps) {
  const t = useTranslations("announcement");
  const reduce = usePrefersReducedMotion();
  const [[index, dir], setPage] = useState<[number, number]>([0, 0]);
  const last = index === slides.length - 1;
  const slide = slides[index];

  const go = (to: number) => {
    if (to < 0 || to >= slides.length || to === index) return;
    setPage([to, to > index ? 1 : -1]);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(index + 1);
    else if (e.key === "ArrowLeft") go(index - 1);
  };
  const shift = reduce ? 0 : 36;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onKeyDown={onKeyDown}
        className="w-[calc(100vw-24px)] max-w-[440px] gap-0 overflow-hidden rounded-2xl p-0 sm:rounded-2xl"
      >
        <motion.div
          drag={reduce ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          onDragEnd={(_, info) => {
            if (info.offset.x < -SWIPE_PX) go(index + 1);
            else if (info.offset.x > SWIPE_PX) go(index - 1);
          }}
          className="touch-pan-y"
        >
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={slide.id}
              custom={dir}
              initial={{ opacity: 0, x: dir * shift }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir * shift }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="relative h-[clamp(240px,40dvh,320px)] border-b border-stone-200 bg-white bg-[radial-gradient(#e2e0dd_1.1px,transparent_1.4px)] bg-[length:16px_16px] bg-[position:6px_6px] px-3 pt-2">
                {slide.visual}
              </div>
              <div className="grid gap-2 px-6 pb-1 pt-5">
                <span className="w-fit rounded-full bg-emerald-700/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  {t("badge")}
                </span>
                <DialogTitle className="font-serif text-[21px] font-semibold leading-snug tracking-tight text-stone-900">
                  {slide.title}
                </DialogTitle>
                <DialogDescription className="min-h-[3.4em] text-[14px] leading-relaxed text-stone-500">
                  {slide.body}
                </DialogDescription>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div className="flex items-center justify-between gap-3 px-6 pb-5 pt-3">
          <div className="flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={t("go_to_slide", { index: i + 1 })}
                aria-current={i === index ? "step" : undefined}
                onClick={() => go(i)}
                className={cn(
                  "h-1.5 cursor-pointer rounded-full transition-all",
                  i === index ? "w-5 bg-stone-900" : "w-1.5 bg-stone-300",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {index > 0 && (
              <button
                type="button"
                onClick={() => go(index - 1)}
                className="h-10 cursor-pointer rounded-full px-3.5 text-sm font-semibold text-stone-500 hover:text-stone-900"
              >
                {t("prev")}
              </button>
            )}
            {last ? (
              finalAction
            ) : (
              <button
                type="button"
                onClick={() => go(index + 1)}
                className="h-10 cursor-pointer rounded-full bg-stone-900 px-5 text-sm font-semibold text-white hover:bg-stone-800"
              >
                {t("next")}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
