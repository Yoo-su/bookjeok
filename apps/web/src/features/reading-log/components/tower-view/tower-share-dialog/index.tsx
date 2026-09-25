"use client";

import type { ReadingTowerBook } from "@bookjeok/core";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { cn } from "@/shared/utils";
import { gaegu, gowun_batang } from "@/styles/fonts";

import type { SceneLabels } from "../lib/scene";
import {
  renderTowerShareImage,
  type ShareFormat,
  type ShareTexts,
} from "../lib/share-image";
import type { TowerStatus } from "../lib/status";
import type { TowerCharacter } from "../lib/types";
import { TowerHeightChip } from "../tower-height-chip";

interface TowerShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  books: ReadingTowerBook[];
  towerMm: number;
  userMm: number;
  character: TowerCharacter;
  status: TowerStatus;
  labels: SceneLabels;
  texts: ShareTexts;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 책탑 공유 이미지. 브라우저에서 바로 그려 모바일은 공유 시트로, 데스크톱은 파일로 내보낸다.
 */
export function TowerShareDialog({
  open,
  onOpenChange,
  year,
  ...scene
}: TowerShareDialogProps) {
  const t = useTranslations("reading_log.tower.share");
  const [format, setFormat] = useState<ShareFormat>("story");
  const [image, setImage] = useState<{ url: string; blob: Blob } | null>(null);
  const [failed, setFailed] = useState(false);
  const [rendering, setRendering] = useState(false);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  useEffect(() => {
    // 닫히면 내용이 사라져 해제한 blob URL을 다시 열 수 없다
    if (!open) {
      setImage(null);
      return;
    }
    let cancelled = false;
    let url: string | null = null;
    setFailed(false);
    setRendering(true);
    // 키 슬라이더를 끄는 동안 매번 다시 그리지 않게 잠깐 기다린다
    const timer = setTimeout(async () => {
      try {
        const canvas = await renderTowerShareImage({
          format,
          ...sceneRef.current,
          fonts: {
            hand: gaegu.style.fontFamily,
            serif: gowun_batang.style.fontFamily,
            ui: '"Pretendard Variable", "Pretendard Fallback", sans-serif',
          },
        });
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
        if (cancelled) return;
        if (!blob) throw new Error("canvas.toBlob returned null");
        url = URL.createObjectURL(blob);
        setImage({ url, blob });
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setRendering(false);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, format, scene.userMm, scene.character]);

  const filename = `bookjeok-tower-${year}.png`;

  const handleShare = async () => {
    if (!image) return;
    const file = new File([image.blob], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (e) {
        // 사용자가 공유 시트를 닫은 경우
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    download(image.blob, filename);
    toast.info(t("failed"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94dvh] overflow-y-auto sm:max-w-[460px]">
        <DialogTitle className="text-[17px] font-bold">
          {t("title")}
        </DialogTitle>
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl bg-stone-100 p-3.5">
          {image ? (
            <Image
              src={image.url}
              alt={t("image_alt")}
              width={1080}
              height={format === "story" ? 1920 : 1350}
              unoptimized
              className={cn(
                "h-auto max-h-[52dvh] w-auto max-w-full rounded-lg shadow-[0_10px_30px_-10px_rgba(0,0,0,.4)] transition-opacity",
                rendering && "opacity-60",
              )}
            />
          ) : (
            <span
              role={failed ? "alert" : undefined}
              className="text-sm text-stone-500"
            >
              {failed ? t("render_failed") : t("rendering")}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div
            role="group"
            aria-label={t("format_label")}
            className="inline-flex gap-0.5 rounded-full bg-stone-100 p-[3px]"
          >
            {(["story", "feed"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={format === f}
                onClick={() => setFormat(f)}
                className={cn(
                  "cursor-pointer rounded-full px-3 py-1.5 text-[12.5px] font-semibold",
                  format === f
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500",
                )}
              >
                {t(f)}
              </button>
            ))}
          </div>
          <TowerHeightChip />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!image}
            onClick={() => image && download(image.blob, filename)}
            className="cursor-pointer rounded-full border border-stone-300 bg-white py-3 text-sm font-bold text-stone-900 disabled:opacity-40"
          >
            {t("save")}
          </button>
          <button
            type="button"
            disabled={!image}
            onClick={handleShare}
            className="cursor-pointer rounded-full bg-stone-900 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {t("share")}
          </button>
        </div>
        <DialogDescription className="-mt-1 text-center text-xs text-stone-500">
          {t("hint")}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
