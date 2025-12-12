"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Edit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/features/auth/store";
import { useToggleReviewReactionMutation } from "@/features/review/mutations";
import { useMyReviewReactionQuery } from "@/features/review/queries";
import { ReviewReactionType } from "@/features/review/types";
import { Button } from "@/shared/components/shadcn/button";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";

import { REACTION_CONFIG } from "../../constants";

interface ReviewDetailActionsProps {
  isAuthor: boolean;
  reviewId: string;
  reactionCounts?: {
    [key in ReviewReactionType]: number;
  };
}
export function ReviewDetailActions({
  isAuthor,
  reviewId,
  reactionCounts,
}: ReviewDetailActionsProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { mutate: toggleReaction, isPending: isMutating } =
    useToggleReviewReactionMutation(Number(reviewId));

  const { data: myReaction, isPending: isReactionPending } =
    useMyReviewReactionQuery(Number(reviewId), !!user);

  // 쿼리 로딩 중이거나 mutation 진행 중일 때 버튼 비활성화
  const isReactionLoading = !!user && (isReactionPending || isMutating);

  const handleReactionClick = (type: ReviewReactionType) => {
    if (!user) {
      router.push(PATHS.LOGIN);
      return;
    }
    toggleReaction(type);
  };

  return (
    <div className="mt-16 pt-8 border-t border-stone-100">
      {/* Reaction Buttons */}
      <div className="flex justify-center gap-4 mb-12">
        {REACTION_CONFIG.map(
          ({ type, icon: Icon, label, color, bgColor, ringColor }) => {
            const isActive = myReaction === type;
            const count = reactionCounts?.[type] || 0;

            return (
              <motion.button
                key={type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleReactionClick(type)}
                disabled={isReactionLoading}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 min-w-[80px]",
                  isReactionLoading ? "opacity-50 cursor-not-allowed" : "",
                  isActive
                    ? `${bgColor} ring-2 ring-offset-2 ${ringColor}`
                    : "hover:bg-stone-50"
                )}
              >
                <div
                  className={cn(
                    "p-3 rounded-full transition-colors",
                    isActive ? "bg-white shadow-sm" : "bg-stone-100",
                    isActive ? color : "text-stone-400"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6",
                      isActive &&
                        type === ReviewReactionType.LIKE &&
                        "fill-current"
                    )}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isActive ? "text-stone-900" : "text-stone-500"
                    )}
                  >
                    {label}
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={count}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={cn(
                        "text-xs font-bold",
                        isActive ? color : "text-stone-400"
                      )}
                    >
                      {count}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          }
        )}
      </div>

      {/* 네비게이션 & 편집 버튼 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="text-stone-500 hover:text-stone-900"
          asChild
        >
          <Link href={PATHS.REVIEWS}>← Back to Reviews</Link>
        </Button>

        {isAuthor && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-stone-200 hover:bg-stone-50"
              asChild
            >
              <Link href={PATHS.REVIEW_EDIT(reviewId)}>
                <Edit className="w-4 h-4 mr-2" />
                리뷰 수정하기
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
