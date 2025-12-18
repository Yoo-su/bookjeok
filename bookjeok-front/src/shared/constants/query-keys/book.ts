import { createQueryKeys } from "@lukemorales/query-key-factory";

import {
  GetBookListParams,
  SearchBookSalesParams,
  UseInfiniteRelatedSalesQueryProps,
} from "@/features/book/types";

export const bookKeys = createQueryKeys("book", {
  // 객체 대신 개별 값으로 구성하여 서버/클라이언트 간 키 일치 보장
  list: (params: GetBookListParams) => [
    params.query,
    params.display ?? 10,
    params.start ?? 1,
    params.sort ?? "sim",
  ],
  detail: (isbn: string) => [isbn],
  search: (query: string) => [query],
  marketSales: (params: SearchBookSalesParams) => ["market", params],
  popularSales: null,
  mySales: null,
  relatedSales: ({
    isbn,
    city,
    district,
    limit,
  }: UseInfiniteRelatedSalesQueryProps) => [isbn, city, district, limit],
  saleDetail: (saleId: string) => [saleId],
  recentSales: null,
  popularBooks: null,
});
