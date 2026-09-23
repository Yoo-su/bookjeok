"use client";

import { ReviewReactionType } from "@bookjeok/core";
import { useMyReviewReactionQuery } from "@bookjeok/react-query";
import {
  AnimatePresence,
  motion,
  type TargetAndTransition,
  useReducedMotion,
} from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { saveReturnUrl } from "@/features/auth/utils/return-url";
import { useToggleReviewReactionMutation } from "@/features/review/mutations";
import { usePathname, useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";

import { REACTION_CONFIG } from "../../../constants/ui";

// 반응마다 성격이 다른 움직임을 준다. 하트는 뛰고, 전구는 흔들리고, 반짝이는 돈다.
const HOVER_MOTION: Record<ReviewReactionType, TargetAndTransition> = {
  [ReviewReactionType.LIKE]: { scale: [1, 1.15, 1, 1.1, 1] },
  [ReviewReactionType.INSIGHTFUL]: { rotate: [0, -12, 10, -6, 0] },
  [ReviewReactionType.SUPPORT]: { rotate: [0, 20, -10, 0], scale: [1, 1.1, 1] },
};
const PRESS_MOTION: Record<ReviewReactionType, TargetAndTransition> = {
  [ReviewReactionType.LIKE]: { scale: [1, 1.5, 0.85, 1.1, 1] },
  [ReviewReactionType.INSIGHTFUL]: {
    rotate: [0, -25, 20, -12, 6, 0],
    y: [0, -4, 0],
  },
  [ReviewReactionType.SUPPORT]: { rotate: [0, 360], scale: [1, 1.4, 1] },
};
const PARTICLES = 8;

function Burst({ className }: { className: string }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {Array.from({ length: PARTICLES }, (_, index) => {
        const angle = (index / PARTICLES) * Math.PI * 2;
        const distance = index % 2 ? 16 : 22;
        return (
          <motion.span
            key={index}
            className={cn(
              "absolute left-1/2 top-1/2 -ml-[3px] -mt-[3px] size-1.5 rounded-full bg-current",
              className,
            )}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: 0,
              opacity: 0,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        );
      })}
    </span>
  );
}

interface ReviewDetailActionsProps {
  reviewId: string;
  reactionCounts?: {
    [key in ReviewReactionType]: number;
  };
}
export function ReviewDetailActions({
  reviewId,
  reactionCounts,
}: ReviewDetailActionsProps) {
  const tReactions = useTranslations("review.reactions");
  const router = useRouter();
  const pathname = usePathname();
  const userState = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const user = mounted ? userState : null;
  const { mutate: toggleReaction, isPending: isMutating } =
    useToggleReviewReactionMutation(Number(reviewId));

  const { data: myReaction, isPending: isReactionPending } =
    useMyReviewReactionQuery(Number(reviewId), !!user);

  // 쿼리 로딩 중이거나 mutation 진행 중일 때 버튼 비활성화
  const isReactionLoading = !!user && (isReactionPending || isMutating);

  const reduced = useReducedMotion();
  // 누른 순간 바로 반응하도록 서버 응답을 기다리지 않고 애니메이션을 튼다
  const [burst, setBurst] = useState<{
    type: ReviewReactionType;
    key: number;
  } | null>(null);

  const handleReactionClick = (type: ReviewReactionType) => {
    if (!user) {
      saveReturnUrl(pathname);
      router.push(PATHS.LOGIN);
      return;
    }
    if (myReaction !== type && !reduced) setBurst({ type, key: Date.now() });
    toggleReaction(type);
  };

  return (
    <section className="mt-16 flex flex-col items-center gap-4 border-t border-stone-100 pt-10">
      <p className="text-sm text-stone-500">{tReactions("prompt")}</p>
      <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:justify-center">
        {REACTION_CONFIG.map(
          ({ type, icon: Icon, labelKey, color, bgColor, ringColor }) => {
            const isActive = myReaction === type;
            const count = reactionCounts?.[type] || 0;

            return (
              <motion.button
                key={type}
                type="button"
                whileHover="hover"
                whileTap={{ scale: 0.92 }}
                onClick={() => handleReactionClick(type)}
                disabled={isReactionLoading}
                aria-pressed={isActive}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-sm ring-1 sm:h-11 sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 sm:py-0 transition-colors disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-700",
                  isActive
                    ? cn(bgColor, ringColor, "font-semibold text-stone-900")
                    : "bg-white text-stone-600 ring-stone-200 hover:bg-stone-50 hover:ring-stone-300",
                )}
              >
                <motion.span
                  variants={reduced ? undefined : { hover: HOVER_MOTION[type] }}
                  transition={{ duration: 0.5 }}
                  className="relative inline-flex"
                >
                  <motion.span
                    key={burst?.type === type ? `icon-${burst.key}` : "icon"}
                    animate={
                      burst?.type === type ? PRESS_MOTION[type] : undefined
                    }
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className={cn(
                      "inline-flex transition-colors",
                      isActive ? color : "text-stone-400",
                    )}
                  >
                    <Icon
                      variant={isActive ? "bold" : "outline"}
                      className="size-5"
                    />
                  </motion.span>
                  {burst?.type === type && (
                    <Burst key={`burst-${burst.key}`} className={color} />
                  )}
                </motion.span>
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <span>{tReactions(labelKey)}</span>
                  <span className="relative inline-flex min-w-[1ch] justify-center overflow-hidden tabular-nums">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={count}
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "-100%", opacity: 0 }}
                        className={isActive ? color : "text-stone-400"}
                      >
                        {count}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </span>
              </motion.button>
            );
          },
        )}
      </div>
    </section>
  );
}
