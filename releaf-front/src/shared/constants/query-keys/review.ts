import { createQueryKeys } from "@lukemorales/query-key-factory";

export const reviewKeys = createQueryKeys("review", {
  all: null,
  list: (params: any) => ({
    queryKey: [params],
  }),
  feeds: {
    queryKey: null,
  },
  detail: (id: number) => ({
    queryKey: [id],
  }),
});
