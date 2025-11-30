import { useQueries, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/query-keys";

import { getArtDetail, getArtList } from "./apis";
import { ArtItem, Genre, GetArtListParams } from "./types";

/**
 * 공연/예술 목록을 조회하는 쿼리 훅입니다.
 * @param params 조회 파라미터
 */
export const useArtListQuery = (params: GetArtListParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.artKeys.list(params).queryKey,
    queryFn: async () => {
      const result = await getArtList(params);

      // 배열인 경우 성공으로 간주
      if (Array.isArray(result)) {
        return result;
      }

      // 객체이고 success가 false인 경우
      if ("success" in result && !result.success) {
        return [] as ArtItem[];
      }

      return [] as ArtItem[];
    },
    staleTime: Infinity,
  });
};

/**
 * 공연/예술 상세 정보 조회 쿼리
 * @param artId - 조회할 공연의 ID
 */
export const useArtDetailQuery = (artId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.artKeys.detail(artId).queryKey,
    queryFn: async () => {
      const result = await getArtDetail(artId);
      if (!result.success) {
        return null;
      }
      return result;
    },
    enabled: !!artId, // artId가 있을 때만 쿼리 실행
    staleTime: 24 * 60 * 60 * 1000, // 24시간 동안 데이터를 fresh 상태로 유지
  });
};

/**
 * 메인 페이지용 공연/예술 목록 쿼리 훅입니다.
 * 여러 장르의 공연 목록을 병렬로 조회합니다.
 * @param mainArts 장르와 제목을 포함한 배열
 */
export const useMainArtsQueries = (
  mainArts: { genreCode: Genre; title: string }[]
) => {
  return useQueries({
    queries: mainArts.map(({ genreCode }) => ({
      queryKey: QUERY_KEYS.artKeys.list({ genreCode }).queryKey,
      queryFn: async () => {
        const result = await getArtList({ genreCode, rows: "20" });

        if (Array.isArray(result)) {
          return result;
        }

        if ("success" in result && !result.success) {
          return [] as ArtItem[];
        }

        return [] as ArtItem[];
      },
      staleTime: Infinity,
    })),
  });
};
