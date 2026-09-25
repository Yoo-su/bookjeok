import { createQueryKeys } from "@lukemorales/query-key-factory";

export const readingLogKeys = createQueryKeys("readingLog", {
  list: (params?: { year?: number; month?: number; limit?: number }) => ({
    queryKey: [params],
  }),
  stats: (year: number, month: number) => ({
    queryKey: [year, month],
  }),
  settings: null,
  infinite: null,
  tower: (year: number) => ({
    queryKey: [year],
  }),
  publicTower: (handle: string, year: number) => ({
    queryKey: [handle, year],
  }),
  // ✅ 라운지 전용 쿼리 키 추가
  loungeFeed: null,
  loungePopular: null,
  loungeActiveReaders: null,
  loungeBookReaders: (isbn: string) => ({
    queryKey: [isbn],
  }),
});
