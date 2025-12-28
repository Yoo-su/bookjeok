import { useQueries, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/query-keys";

import { getArtDetail, getArtList } from "./apis";
import { ArtItem, Genre, GetArtListParams } from "./types";

/**
 * 공연/예술 목록 조회
 */
export const useArtListQuery = (params: GetArtListParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.artKeys.list(params).queryKey,
    queryFn: async () => {
      const result = await getArtList(params);

      if (Array.isArray(result)) {
        return result;
      }

      if ("success" in result && !result.success) {
        return [] as ArtItem[];
      }

      return [] as ArtItem[];
    },
  });
};

/**
 * 공연/예술 상세 조회
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
    enabled: !!artId,
  });
};

/**
 * 메인 페이지용 공연 목록 (여러 장르 병렬 조회)
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
    })),
  });
};
