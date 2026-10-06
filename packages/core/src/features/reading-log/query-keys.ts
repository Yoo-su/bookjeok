import { createQueryKeys } from "@lukemorales/query-key-factory";

export const readingLogKeys = createQueryKeys("readingLog", {
  list: (params?: { year?: number; month?: number; limit?: number }) => ({
    queryKey: [params],
  }),
  settings: null,
  infinite: null,
  stack: (year: number) => ({
    queryKey: [year],
  }),
  publicStack: (handle: string, year: number) => ({
    queryKey: [handle, year],
  }),
  bookStatus: (isbn: string) => ({
    queryKey: [isbn],
  }),
  // ✅ 라운지 전용 쿼리 키 추가
  loungeFeed: null,
  loungePopular: null,
  loungeActiveReaders: null,
  loungeMountain: null,
  mountainMine: null,
  loungeBookReaders: (isbn: string) => ({
    queryKey: [isbn],
  }),
  kongsReceived: null,
  kongsSent: (handle: string) => ({
    queryKey: [handle],
  }),
});
