import { useQueries, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/query-keys";

import { getArtDetail, getArtList } from "./apis";
import { ArtItem, Genre, GetArtListParams } from "./types";

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
