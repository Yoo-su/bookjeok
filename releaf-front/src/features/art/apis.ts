import { API_PATHS } from "@/shared/constants/apis";
import { internalAxios } from "@/shared/libs/axios";
import { getSimpleDate } from "@/shared/utils/date";

import {
  DEFAULT_CITY_CODE,
  DEFAULT_PAGE,
  DEFAULT_PRFSTATE,
  DEFAULT_ROWS,
} from "./constants";
import {
  ArtListErrorResponse,
  ArtListSuccessResponse,
  GetArtDetailResponse,
  GetArtListParams,
} from "./types";

export const getArtList = async (
  params: GetArtListParams
): Promise<ArtListSuccessResponse | ArtListErrorResponse> => {
  const searchParams = new URLSearchParams();

  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  // 기본값: 한 달 전 ~ 한 달 후
  const defaultStart = new Date(now);
  defaultStart.setMonth(defaultStart.getMonth() - 1);

  const defaultEnd = new Date(now);
  defaultEnd.setMonth(defaultEnd.getMonth() + 1);

  const startDateStr = params.startDate ?? getSimpleDate(defaultStart);
  const endDateStr = params.endDate ?? getSimpleDate(defaultEnd);

  searchParams.set("cpage", params.cpage ?? DEFAULT_PAGE);
  searchParams.set("rows", params.rows ?? DEFAULT_ROWS);
  searchParams.set("prfstate", params.prfstate ?? DEFAULT_PRFSTATE);
  searchParams.set("genreCode", params.genreCode);
  searchParams.set("startDate", startDateStr);
  searchParams.set("endDate", endDateStr);
  searchParams.set("signgucode", params.signgucode ?? DEFAULT_CITY_CODE);

  const url = `${API_PATHS.art.list}?${searchParams.toString()}`;
  const { data } = await internalAxios.get(url);

  return data;
};

/**
 * 공연/예술 상세 정보 조회 API
 * @param artId - 공연 ID (mt20id)
 */
export const getArtDetail = async (
  artId: string
): Promise<GetArtDetailResponse> => {
  const { data } = await internalAxios.get(API_PATHS.art.detail(artId));

  return data;
};
