"use client";

import type { ReadingStackBook } from "@bookjeok/core";
import { useReadingLogSettingsQuery } from "@bookjeok/react-query";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { DocumentCopy } from "@/shared/components/icons/iconsax";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils";
import { gaegu, gowun_batang } from "@/styles/fonts";

import { useUpdateReadingLogSettingsMutation } from "../../../mutations";
import type { StackCompareMode } from "../../../stores/use-stack-settings-store";
import { LEGEND_MAX } from "../lib/legend";
import { bookColor, type SceneLabels } from "../lib/scene";
import {
  renderStackShareImage,
  type ShareFormat,
  type ShareTexts,
} from "../lib/share-image";
import type { StackStatus } from "../lib/status";
import type { StackCharacter } from "../lib/types";
import { StackHeightChip } from "../stack-height-chip";
import type { StackStageObject } from "../stack-stage";

interface StackShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  books: ReadingStackBook[];
  stackMm: number;
  userMm: number;
  character: StackCharacter;
  status: StackStatus;
  labels: SceneLabels;
  texts: ShareTexts;
  /** 열 때 고를 비교 대상. 화면에서 보던 탭 */
  initialMode: StackCompareMode;
  /** 사물 무대와 그 부제 */
  object: StackStageObject & { subline: string };
  /** 이미지를 본 사람이 들어올 공개 프로필의 주인 */
  handle?: string;
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
 * 독서 키재기 공유 이미지. 브라우저에서 바로 그려 모바일은 공유 시트로, 데스크톱은 파일로 내보낸다.
 */
export function StackShareDialog({
  open,
  onOpenChange,
  year,
  initialMode,
  object,
  handle,
  ...scene
}: StackShareDialogProps) {
  const t = useTranslations("reading_log.stack.share");
  const tStack = useTranslations("reading_log.stack");
  const locale = useLocale();
  const { data: settings } = useReadingLogSettingsQuery();
  const { mutate: updateSettings, isPending: publishing } =
    useUpdateReadingLogSettingsMutation();
  const isPrivate = settings?.isReadingLogPublic === false;
  // 이미지와 같은 연도로 열리게 하고, 공유로 들어온 방문을 ref로 구분한다
  const profilePath = handle
    ? PATHS.USER_PROFILE(encodeURIComponent(handle))
    : null;
  const profileUrl =
    profilePath && typeof window !== "undefined"
      ? `${window.location.origin}/${locale}${profilePath}?year=${year}&ref=share`
      : null;
  const [format, setFormat] = useState<ShareFormat>("story");
  const [mode, setMode] = useState(initialMode);
  // 열 때마다 화면에서 보던 탭으로 시작한다
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);
  const objectRef = useRef(object);
  objectRef.current = object;
  const [image, setImage] = useState<{ url: string; blob: Blob } | null>(null);
  const [failed, setFailed] = useState(false);
  const [rendering, setRendering] = useState(false);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  // 제목을 적을 책. 고르기 전에는 맨 위(최근) 책들
  const [picked, setPicked] = useState<string[] | null>(null);
  const [picking, setPicking] = useState(false);
  const legendIds = useMemo(() => {
    const exists = new Set(scene.books.map((b) => b.logId));
    return (
      picked?.filter((id) => exists.has(id)) ??
      scene.books.slice(-LEGEND_MAX).map((b) => b.logId)
    );
  }, [picked, scene.books]);
  const newestFirst = useMemo(() => [...scene.books].reverse(), [scene.books]);
  const rest = scene.books.length - legendIds.length;
  const legendRef = useRef<
    { ids: string[]; heading: string; rest?: string } | undefined
  >(undefined);
  legendRef.current = legendIds.length
    ? {
        ids: legendIds,
        heading: t("legend_heading"),
        rest: rest > 0 ? t("legend_rest", { count: rest }) : undefined,
      }
    : undefined;
  const legendKey = legendIds.join(",");
  const toggle = (id: string) =>
    setPicked(
      legendIds.includes(id)
        ? legendIds.filter((v) => v !== id)
        : [...legendIds, id].slice(0, LEGEND_MAX),
    );

  useEffect(() => {
    // 닫히면 내용이 사라져 해제한 blob URL을 다시 열 수 없다
    if (!open) {
      setImage(null);
      setPicking(false);
      return;
    }
    let cancelled = false;
    let url: string | null = null;
    setFailed(false);
    setRendering(true);
    // 키 슬라이더를 끄는 동안 매번 다시 그리지 않게 잠깐 기다린다
    const timer = setTimeout(async () => {
      try {
        const o = objectRef.current;
        const canvas = await renderStackShareImage({
          format,
          ...sceneRef.current,
          ...(mode === "object" && {
            object: o.spec,
            labels: o.labels,
            texts: { ...sceneRef.current.texts, subline: o.subline },
          }),
          legend: legendRef.current,
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
  }, [
    open,
    format,
    mode,
    scene.userMm,
    scene.character,
    object.spec.id,
    legendKey,
  ]);

  const filename = `bookjeok-reading-height-${year}.png`;

  const copyLink = () => {
    if (!profileUrl) return Promise.resolve(false);
    return (
      navigator.clipboard
        ?.writeText(profileUrl)
        .then(() => true)
        .catch(() => false) ?? Promise.resolve(false)
    );
  };

  const handleCopy = async () => {
    if (await copyLink()) toast.success(t("link_copied"));
    else toast.error(t("link_copy_failed"));
  };

  const handleShare = async () => {
    if (!image) return;
    // 이미지 파일에는 링크를 담을 수 없어 클립보드에 같이 넣어 둔다. 링크를 공유 데이터에 섞으면
    // 인스타 스토리처럼 이미지만 받는 앱이 목록에서 빠질 수 있어 공유는 파일만 보낸다.
    // 사파리는 await 뒤의 share()를 사용자 동작 밖으로 보므로 복사를 기다리지 않는다
    void copyLink();
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
            aria-label={t("mode_label")}
            className="inline-flex gap-0.5 rounded-full bg-stone-100 p-[3px]"
          >
            {(["object", "person"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "cursor-pointer rounded-full px-3 py-1.5 text-[12.5px] font-semibold",
                  mode === m
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500",
                )}
              >
                {tStack(m === "object" ? "mode_object" : "mode_person")}
              </button>
            ))}
          </div>
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
          {mode === "person" && <StackHeightChip />}
        </div>
        <div className="rounded-2xl border border-stone-200 px-3.5 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-stone-800">
              {t("legend_label")}
              <span className="ml-1.5 tabular-nums text-stone-400">
                {legendIds.length}/{LEGEND_MAX}
              </span>
            </span>
            <button
              type="button"
              aria-expanded={picking}
              onClick={() => setPicking((v) => !v)}
              className="cursor-pointer rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-stone-600 hover:bg-stone-100"
            >
              {picking ? t("legend_done") : t("legend_edit")}
            </button>
          </div>
          {picking && (
            <>
              <p className="mt-0.5 text-xs text-stone-500">
                {t("legend_hint", { max: LEGEND_MAX })}
              </p>
              <ul className="-mx-1.5 mt-2 max-h-52 overflow-y-auto">
                {newestFirst.map((b) => {
                  const on = legendIds.includes(b.logId);
                  const full = !on && legendIds.length >= LEGEND_MAX;
                  return (
                    <li key={b.logId}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-[13px] hover:bg-stone-50",
                          full && "cursor-not-allowed opacity-40",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={full}
                          onChange={() => toggle(b.logId)}
                          className="size-4 shrink-0 accent-stone-900"
                        />
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-5 shrink-0 rounded-[2px] border border-stone-900/70"
                          style={{ backgroundColor: bookColor(b) }}
                        />
                        <span className="min-w-0 flex-1 truncate text-stone-800">
                          {b.title}
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-stone-400">
                          {b.date.slice(5).replace("-", ".")}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
        {profileUrl && (
          <div className="rounded-2xl border border-stone-200 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-[13px] text-stone-600">
                {window.location.host}
                {profilePath}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-stone-600 hover:bg-stone-100"
              >
                <DocumentCopy className="h-3.5 w-3.5" />
                {t("link_copy")}
              </button>
            </div>
            {isPrivate ? (
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <p role="alert" className="text-xs text-amber-700">
                  {t("link_private")}
                </p>
                <button
                  type="button"
                  disabled={publishing}
                  onClick={() => updateSettings(true)}
                  className="shrink-0 cursor-pointer rounded-full bg-stone-900 px-2.5 py-1 text-[12px] font-semibold text-white disabled:opacity-40"
                >
                  {t("link_make_public")}
                </button>
              </div>
            ) : (
              <p className="mt-0.5 text-xs text-stone-500">{t("link_hint")}</p>
            )}
          </div>
        )}
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
