"use client";

import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";

import { useKongFlail } from "../hooks/use-kong-flail";
import { FlailingKong } from "../kong-figure/flailing-kong";

interface KongAboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 「콩이란?」 사전 풀이. 콩을 누르면 바둥거린다 */
export function KongAboutDialog({ open, onOpenChange }: KongAboutDialogProps) {
  const t = useTranslations("kong.about");
  const flail = useKongFlail(1200);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-2xl sm:max-w-[400px]">
        <div className="grid justify-items-center gap-1 text-center">
          <button
            type="button"
            onClick={flail.flail}
            aria-label={t("poke")}
            className="mt-1 cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-stone-700"
          >
            <FlailingKong size={140} flail={flail} boil />
          </button>
          <DialogTitle className="mt-1 font-serif text-[28px] font-bold leading-tight text-stone-900">
            {t("word")}
            <span className="ml-1.5 text-sm font-medium text-stone-400">
              {t("pos")}
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("def_1")}
          </DialogDescription>
          <ol className="mt-2 grid list-decimal gap-1.5 justify-self-stretch pl-6 text-left font-[family-name:var(--font-gaegu)] text-[19px] leading-snug text-stone-800">
            <li>{t("def_1")}</li>
            <li>{t("def_2")}</li>
            <li>{t("def_3")}</li>
          </ol>
          <p className="mt-2 text-[13px] text-stone-500">{t("example")}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
