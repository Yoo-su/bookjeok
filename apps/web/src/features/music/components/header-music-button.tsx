"use client";

import { useTranslations } from "next-intl";

import { Disc3 } from "@/shared/components/icons/iconsax";
import { Button } from "@/shared/components/shadcn/button";
import { cn } from "@/shared/utils/cn";

import { useMusicStore } from "../stores/use-music-store";

/**
 * 배경음악 플레이어 진입 아이콘. 재생 중에는 음반이 돈다.
 * 재생/정지는 모달과 FloatingMusicPill이 맡는다.
 */
export function HeaderMusicButton({ className }: { className?: string }) {
  const t = useTranslations("music");
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const toggleModal = useMusicStore((state) => state.toggleModal);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleModal}
      aria-haspopup="dialog"
      aria-label={t("header_button.aria_label")}
      className={cn(
        "w-9 h-9 shrink-0 rounded-full",
        isPlaying
          ? "text-emerald-600 hover:text-emerald-700"
          : "text-stone-500 hover:text-stone-900",
        className,
      )}
    >
      <Disc3
        className={cn("w-5 h-5", isPlaying && "animate-spin")}
        style={{ animationDuration: "3s" }}
        aria-hidden="true"
      />
    </Button>
  );
}
