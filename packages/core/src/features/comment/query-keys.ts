import { createQueryKeys } from "@lukemorales/query-key-factory";

import { CommentTargetType } from "./types";

export const commentKeys = createQueryKeys("comment", {
  list: (
    targetType: CommentTargetType,
    targetId: string,
    page: number,
    viewerId?: number,
  ) => ({
    queryKey: [targetType, targetId, page, viewerId ?? "anonymous"],
  }),
  like: (commentId: number) => ({
    queryKey: [commentId],
  }),
  my: null,
});
