/**
 * 리뷰 관련 mutation key 상수입니다.
 */
export const reviewMutationKeys = {
  toggleReaction: (reviewId: number) =>
    ["review", "toggleReaction", reviewId] as const,
  create: () => ["review", "create"] as const,
  update: (reviewId: number) => ["review", "update", reviewId] as const,
  delete: (reviewId: number) => ["review", "delete", reviewId] as const,
} as const;
