import { createQueryKeys } from "@lukemorales/query-key-factory";

import { CommentTargetType } from "@/features/comment/types";

export const commentKeys = createQueryKeys("comment", {
  list: (targetType: CommentTargetType, targetId: string, page: number) => ({
    queryKey: [targetType, targetId, page],
  }),
  like: (commentId: number) => ({
    queryKey: [commentId],
  }),
  my: null,
});
