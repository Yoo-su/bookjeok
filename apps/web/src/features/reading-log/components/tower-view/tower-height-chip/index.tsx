"use client";

import { useTranslations } from "next-intl";

import { Edit } from "@/shared/components/icons/iconsax";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/shadcn/popover";
import { cn } from "@/shared/utils";

import { useTowerPerson } from "../hooks/use-tower-person";
import { TowerHeightCard } from "../tower-height-card";

/** 내 키·캐릭터를 바꾸는 작은 버튼. 누르면 입력 카드가 뜬다 */
export function TowerHeightChip({ className }: { className?: string }) {
  const t = useTranslations("reading_log.tower");
  const { character, heightCm, isDefaultHeight, setHeightCm, setCharacter } =
    useTowerPerson();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-600 hover:text-stone-900 pointer-fine:h-7",
            isDefaultHeight && "border-blue-200 text-blue-700",
            className,
          )}
        >
          <Edit className="h-3.5 w-3.5" />
          {isDefaultHeight
            ? t("height_chip_default")
            : t("height_chip", { cm: heightCm })}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(300px,calc(100vw-32px))] p-0"
      >
        <TowerHeightCard
          className="border-0"
          heightCm={heightCm}
          isDefaultHeight={isDefaultHeight}
          character={character}
          onHeightChange={setHeightCm}
          onCharacterChange={setCharacter}
        />
      </PopoverContent>
    </Popover>
  );
}
