import { createQueryKeys } from "@lukemorales/query-key-factory";

export const searchKeys = createQueryKeys("search", {
  preview: (query: string) => ({
    queryKey: [query],
  }),
});
