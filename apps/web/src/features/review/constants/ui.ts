import { ReviewReactionType } from "@bookjeok/core";

import { Heart, Lightbulb, Sparkles } from "@/shared/components/icons/iconsax";

// 라벨은 `review.reactions` 메시지 키로만 들고 있고, 문구는 사용하는 쪽에서 번역한다
export const REACTION_CONFIG = [
  {
    type: ReviewReactionType.LIKE,
    icon: Heart,
    labelKey: "like",
    color: "text-rose-500",
    bgColor: "bg-rose-50",
    ringColor: "ring-rose-200",
  },
  {
    type: ReviewReactionType.INSIGHTFUL,
    icon: Lightbulb,
    labelKey: "insightful",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    ringColor: "ring-amber-200",
  },
  {
    type: ReviewReactionType.SUPPORT,
    icon: Sparkles,
    labelKey: "support",
    color: "text-sky-500",
    bgColor: "bg-sky-50",
    ringColor: "ring-sky-200",
  },
];
