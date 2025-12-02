import { createQueryKeys } from "@lukemorales/query-key-factory";

import { GetReviewsParams } from "@/features/review/types";

export const reviewKeys = createQueryKeys("review", {
  list: (params: GetReviewsParams) => ({
    queryKey: [params],
  }),
  feeds: {
    queryKey: null,
  },
  popular: {
    queryKey: null,
  },
  detail: (id: number) => ({
    queryKey: [id],
  }),
});
