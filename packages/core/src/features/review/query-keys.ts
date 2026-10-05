import { createQueryKeys } from "@lukemorales/query-key-factory";

import { GetReviewsParams } from "./types";

export const reviewKeys = createQueryKeys("review", {
  list: (params: GetReviewsParams) => ({
    queryKey: [params],
    // 같은 params의 일반 목록과 pages 형태가 한 캐시에 섞이지 않게 분리 (list._def 무효화는 공유)
    contextQueries: {
      infinite: null,
    },
  }),
  feeds: () => ({
    queryKey: [undefined],
  }),
  popular: null,
  detail: (id: number) => ({
    queryKey: [id],
  }),
  forEdit: (id: number) => ({
    queryKey: ["edit", id],
  }),
  recommend: (id: number) => ({
    queryKey: [id],
  }),
  tagSuggestions: (q: string) => ({
    queryKey: [q],
  }),
});
