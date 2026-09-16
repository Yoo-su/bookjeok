"use client";

import { useTranslations } from "next-intl";
import React from "react";

import { BoxIcon, TruckFastIcon } from "@/shared/components/icons";
import { CheckCircle2, Lock } from "@/shared/components/icons/iconsax";

export const EscrowInfoCard = () => {
  const t = useTranslations("order.escrow_card");

  const steps = [
    { icon: Lock, key: "step1" },
    { icon: TruckFastIcon, key: "step2" },
    { icon: BoxIcon, key: "step3" },
    { icon: CheckCircle2, key: "step4" },
  ] as const;

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-5 shadow-2xs space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-emerald-600" />
        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          {t("title")}
        </h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.key}
              className="flex items-start gap-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 p-3 border border-stone-200/60 dark:border-stone-800"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="font-semibold text-stone-900 dark:text-stone-100 block">
                  {t(`${s.key}_title`)}
                </span>
                <p className="text-stone-500 dark:text-stone-400 leading-relaxed text-[11px]">
                  {t(`${s.key}_desc`)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
