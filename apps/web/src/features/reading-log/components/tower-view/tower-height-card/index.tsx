"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Minus, Plus } from "@/shared/components/icons/iconsax";
import { Slider } from "@/shared/components/shadcn/slider";
import { cn } from "@/shared/utils";

import {
  TOWER_HEIGHT_MAX,
  TOWER_HEIGHT_MIN,
} from "../../../stores/use-tower-settings-store";
import type { TowerCharacter } from "../lib/types";

interface TowerHeightCardProps {
  heightCm: number;
  isDefaultHeight: boolean;
  character: TowerCharacter;
  onHeightChange: (heightCm: number) => void;
  onCharacterChange: (character: TowerCharacter) => void;
  className?: string;
}

/** 내 키 입력과 캐릭터 선택. 키는 기기에만 저장한다 */
export function TowerHeightCard({
  heightCm,
  isDefaultHeight,
  character,
  onHeightChange,
  onCharacterChange,
  className,
}: TowerHeightCardProps) {
  const t = useTranslations("reading_log.tower");
  const [draft, setDraft] = useState(String(heightCm));
  const [invalid, setInvalid] = useState(false);

  // 버튼·슬라이더로 키가 바뀌면 입력칸과 오류 표시를 맞춤
  useEffect(() => {
    setDraft(String(heightCm));
    setInvalid(false);
  }, [heightCm]);

  const isValid = (v: number) =>
    Number.isFinite(v) && v >= TOWER_HEIGHT_MIN && v <= TOWER_HEIGHT_MAX;

  // 입력 중에는 유효할 때만 반영한다. "165"를 치는 도중의 "16"은 오류가 아니다
  const handleChange = (raw: string) => {
    setDraft(raw);
    const v = Number(raw);
    if (raw !== "" && isValid(v)) {
      setInvalid(false);
      onHeightChange(v);
    }
  };

  const handleBlur = (raw: string) => {
    const v = Number(raw);
    if (raw !== "" && isValid(v)) {
      setInvalid(false);
      onHeightChange(v);
    } else {
      setInvalid(true);
    }
  };

  return (
    <div
      className={cn(
        "grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
        <div className="grid gap-0.5">
          <label
            htmlFor="tower-height"
            className="text-[13px] font-bold text-stone-900"
          >
            {t("height_label")}
          </label>
          <span className="text-[11.5px] text-stone-500">
            {isDefaultHeight ? t("height_default_hint") : t("height_hint")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onHeightChange(heightCm - 1)}
            aria-label={t("height_decrease")}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex items-baseline gap-1 rounded-xl border border-stone-300 bg-white px-3 py-1 focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-600/10">
            <input
              id="tower-height"
              type="number"
              inputMode="numeric"
              min={TOWER_HEIGHT_MIN}
              max={TOWER_HEIGHT_MAX}
              value={draft}
              aria-invalid={invalid}
              aria-describedby={invalid ? "tower-height-error" : undefined}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={(e) => handleBlur(e.target.value)}
              className="w-[3.2ch] appearance-none border-0 bg-transparent text-right text-[22px] font-semibold tabular-nums text-stone-900 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-[13px] text-stone-500">cm</span>
          </div>
          <button
            type="button"
            onClick={() => onHeightChange(heightCm + 1)}
            aria-label={t("height_increase")}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Slider
        value={[heightCm]}
        min={TOWER_HEIGHT_MIN}
        max={TOWER_HEIGHT_MAX}
        step={1}
        onValueChange={([v]) => onHeightChange(v)}
        aria-label={t("height_slider")}
      />
      {invalid && (
        <span id="tower-height-error" className="text-xs text-red-600">
          {t("height_error", { min: TOWER_HEIGHT_MIN, max: TOWER_HEIGHT_MAX })}
        </span>
      )}

      <div className="flex flex-wrap items-center gap-2.5 border-t border-stone-200 pt-3">
        <span
          id="tower-character"
          className="mr-0.5 text-[13px] font-bold text-stone-900"
        >
          {t("character_label")}
        </span>
        <div
          role="group"
          aria-labelledby="tower-character"
          className="inline-flex gap-0.5 rounded-full bg-stone-100 p-[3px]"
        >
          {(["M", "F"] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={character === c}
              onClick={() => onCharacterChange(c)}
              className={cn(
                "cursor-pointer rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-colors",
                character === c
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700",
              )}
            >
              {c === "M" ? t("character_m") : t("character_f")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
