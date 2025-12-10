import { Heart, Lightbulb, Sparkles } from "lucide-react";

import { ReviewReactionType } from "./types";

export const BOOK_DOMAINS = [
  "소설",
  "에세이",
  "자기계발",
  "인문",
  "경제/경영",
  "과학",
  "예술",
  "역사",
  "철학",
  "종교",
  "만화",
  "기타",
] as const;

export type BookDomain = (typeof BOOK_DOMAINS)[number];

export const REACTION_CONFIG = [
  {
    type: ReviewReactionType.LIKE,
    icon: Heart,
    label: "좋아요",
    color: "text-rose-500",
    bgColor: "bg-rose-50",
    ringColor: "ring-rose-200",
  },
  {
    type: ReviewReactionType.INSIGHTFUL,
    icon: Lightbulb,
    label: "유익해요",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    ringColor: "ring-amber-200",
  },
  {
    type: ReviewReactionType.SUPPORT,
    icon: Sparkles,
    label: "응원해요",
    color: "text-sky-500",
    bgColor: "bg-sky-50",
    ringColor: "ring-sky-200",
  },
];
