import { useReadingLogSettingsQuery } from "@bookjeok/react-query";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { Label } from "@/shared/components/shadcn/label";
import { Switch } from "@/shared/components/shadcn/switch";
import { cn } from "@/shared/utils";

import { useSeasonalTheme } from "../../../hooks/use-seasonal-theme";
import { useUpdateReadingLogSettingsMutation } from "../../../mutations";
import { ShareDeckDialog } from "../../deck-view/share-deck-dialog";

interface ReadingLogHeroProps {
  currentDate: Date;
}

export function ReadingLogHero({ currentDate }: ReadingLogHeroProps) {
  const t = useTranslations("reading_log.hero");
  const tDeck = useTranslations("reading_log.deck");
  // 테마 및 배경 이미지 로직
  const theme = useSeasonalTheme(currentDate);
  const [isMounted, setIsMounted] = useState(false);
  const [bgImage, setBgImage] = useState<string>("");
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const seasonName = useMemo(() => {
    return theme.name === "autumn" ? "fall" : theme.name;
  }, [theme.name]);

  useEffect(() => {
    // 계절이 바뀔 때만 랜덤 이미지 재선택 (또는 페이지 로드 시)
    const randomNum = Math.floor(Math.random() * 2) + 1;
    setBgImage(`/images/season/${seasonName}${randomNum}.jpg`);
    setIsImageLoading(true); // 이미지 변경 시 로딩 시작
  }, [seasonName]);

  // 공개 설정 로직
  const { data: settings } = useReadingLogSettingsQuery();
  const { mutate: updateSettings, isPending } =
    useUpdateReadingLogSettingsMutation();
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (settings) {
      setIsPublic(settings.isReadingLogPublic ?? true);
    }
  }, [settings]);

  const handleToggle = (checked: boolean) => {
    setIsPublic(checked);
    updateSettings(checked);
  };

  const user = useAuthStore((state) => state.user);
  const [isDeckOpen, setIsDeckOpen] = useState(false);

  if (!isMounted) return null;

  return (
    <section className="relative h-[420px] w-full mb-12 overflow-hidden bg-stone-900 group">
      {/* 배경 이미지 */}
      {bgImage && (
        <Image
          src={bgImage}
          alt="Seasonal Background"
          fill
          priority
          onLoad={() => setIsImageLoading(false)}
          className={cn(
            "object-cover object-center transition-all duration-1000 transform scale-105 group-hover:scale-100",
            isImageLoading ? "opacity-0" : "opacity-100",
            // 은은한 시네마틱 필터 적용
            theme.name === "summer" && "brightness-[0.9] saturate-[1.1]",
            theme.name === "winter" && "brightness-[0.9] contrast-[1.1]",
            theme.name === "spring" && "brightness-[0.95] saturate-[1.05]",
            theme.name === "autumn" && "brightness-[0.9] sepia-[0.15]",
          )}
        />
      )}

      {/* 시네마틱 오버레이 - 하단 그라데이션 */}
      <div
        className={cn(
          "absolute inset-0 bg-linear-to-t from-stone-900/90 via-stone-900/40 to-transparent transition-opacity duration-1000",
          isImageLoading ? "opacity-0" : "opacity-100",
        )}
      />

      {/* 히어로 본문 콘텐츠 영역 */}
      <div className="w-full px-4 md:px-6 lg:px-8 xl:max-w-7xl xl:mx-auto relative z-10 h-full flex flex-col justify-end pb-6 md:pb-10 pt-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 w-full">
          {/* 타이포그래피 영역 */}
          <div className="space-y-4 max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="flex items-center gap-3">
              <span className="h-px w-6 md:w-8 bg-white/60" />
              <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-white/90 uppercase">
                {t(`season_label.${theme.name}`)}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-medium text-white tracking-tight leading-[0.95] md:leading-[0.9]">
              {t("title")}
            </h1>

            <p className="text-stone-300 text-sm md:text-lg font-light leading-relaxed max-w-lg">
              {t("subtitle")}
            </p>
          </div>

          {/* 미니멀 공개 여부 스위치 & 자랑하기 버튼 (세로로 배치, 우측 정렬) */}
          <div className="flex flex-col items-end gap-3 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 shrink-0">
            <div className="flex items-center gap-3 px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors duration-300 w-fit">
              <Label
                htmlFor="public-mode"
                className="cursor-pointer text-[10px] md:text-xs font-bold tracking-widest text-white/80 uppercase"
              >
                {t("public_toggle")}
              </Label>
              <Switch
                id="public-mode"
                checked={isPublic}
                disabled={isPending}
                onCheckedChange={handleToggle}
                className="data-[state=checked]:bg-sky-400 data-[state=unchecked]:bg-stone-500/50 border-transparent h-4 w-7 md:h-5 md:w-9 transition-colors duration-300"
              />
            </div>

            {user && (
              <button
                onClick={() => setIsDeckOpen(true)}
                className="px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/15 text-white font-bold text-[10px] md:text-xs tracking-widest uppercase hover:scale-105 active:scale-95 duration-300 shadow-md cursor-pointer transition-all w-fit"
              >
                {tDeck("share_button")}
              </button>
            )}
          </div>
        </div>
      </div>

      {user && (
        <ShareDeckDialog
          year={currentDate.getFullYear()}
          open={isDeckOpen}
          onOpenChange={setIsDeckOpen}
        />
      )}
    </section>
  );
}
