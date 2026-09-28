"use client";

import { FeedbackStatus } from "@bookjeok/core";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/utils/cn";

import { FEEDBACK_STATUS_KEYS } from "../../constants";

const STATUS_STYLES: Record<FeedbackStatus, string> = {
  [FeedbackStatus.RECEIVED]: "border-stone-200 bg-stone-50 text-stone-600",
  [FeedbackStatus.IN_PROGRESS]: "border-sky-200 bg-sky-50 text-sky-700",
  [FeedbackStatus.DONE]: "border-emerald-200 bg-emerald-50 text-emerald-700",
  [FeedbackStatus.WONT_FIX]: "border-stone-200 bg-white text-stone-400",
};

export const FeedbackStatusBadge = ({ status }: { status: FeedbackStatus }) => {
  const t = useTranslations("feedback.status");
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {t(FEEDBACK_STATUS_KEYS[status])}
    </span>
  );
};
