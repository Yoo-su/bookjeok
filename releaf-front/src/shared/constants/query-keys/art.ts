import { createQueryKeys } from "@lukemorales/query-key-factory";

import { CityCode, Genre, PrfState } from "@/features/art/types";

interface Params {
  cpage?: string; // 시작페이지 번호
  rows?: string; // 한번에 가져올 데이터 수
  startDate?: string; // 공연 시작날짜
  endDate?: string; // 공연 마감날짜
  genreCode: Genre; // 장르 코드
  prfstate?: PrfState; // 공연 상태 코드
  signgucode?: CityCode; // 도시 코드
}
export const artKeys = createQueryKeys("art", {
  list: (params: Params) => [params],
  detail: (id: string) => [id],
});
