import { createQueryKeys } from "@lukemorales/query-key-factory";

export const userKeys = createQueryKeys("user", {
  stats: null,
  wishlist: null,
  wishlistCheck: (type: string, id: string | number) => ({
    queryKey: [type, id],
  }),
});
