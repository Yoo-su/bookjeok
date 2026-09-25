"use client";

import {
  getLoungeActiveReaders,
  getLoungeBookReaders,
  getLoungeFeed,
  getLoungePopular,
  getReadingLogs,
  getReadingLogSettings,
  getReadingLogsInfinite,
  getReadingLogStats,
  getPublicReadingTower,
  getReadingTower,
} from "@bookjeok/api-client";
import { readingLogKeys } from "@bookjeok/core";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

/**
 * 독서 기록 목록 조회 (월별/연별/최근 기록 통합)
 */
export const useReadingLogsQuery = (
  params?: { year?: number; month?: number; limit?: number },
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: readingLogKeys.list(params).queryKey,
    queryFn: () => getReadingLogs(params),
    enabled: options?.enabled,
  });
};

/**
 * 월별 독서 통계 조회
 */
export const useReadingLogStatsQuery = (year: number, month: number) => {
  return useQuery({
    queryKey: readingLogKeys.stats(year, month).queryKey,
    queryFn: () => getReadingLogStats({ year, month }),
  });
};

/**
 * 책탑 조회
 */
export const useReadingTowerQuery = (
  year: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: readingLogKeys.tower(year).queryKey,
    queryFn: () => getReadingTower(year),
    enabled: options?.enabled,
  });
};

/**
 * 공개 프로필 책탑 조회
 */
export const usePublicReadingTowerQuery = (handle: string, year: number) => {
  return useQuery({
    queryKey: readingLogKeys.publicTower(handle, year).queryKey,
    queryFn: () => getPublicReadingTower(handle, year),
  });
};

/**
 * 독서 기록 설정 조회
 */
export const useReadingLogSettingsQuery = () => {
  return useQuery({
    queryKey: readingLogKeys.settings.queryKey,
    queryFn: () => getReadingLogSettings(),
  });
};

/**
 * 독서 기록 무한 스크롤 조회
 */
export const useReadingLogsInfiniteQuery = (options?: {
  enabled?: boolean;
}) => {
  return useInfiniteQuery({
    queryKey: readingLogKeys.infinite.queryKey,
    queryFn: ({ pageParam }) =>
      getReadingLogsInfinite(pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: options?.enabled,
  });
};

/**
 * 라운지 피드 무한 스크롤 조회 (공개 - publicAxios 주입)
 */
export const useLoungeFeedInfiniteQuery = () => {
  return useInfiniteQuery({
    queryKey: readingLogKeys.loungeFeed.queryKey,
    queryFn: ({ pageParam }) => getLoungeFeed(pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60 * 1000, // 1분 (공개 피드이므로 적절한 staleTime)
  });
};

/**
 * 라운지 인기 도서 조회 (공개 - publicAxios 주입)
 */
export const useLoungePopularQuery = () => {
  return useQuery({
    queryKey: readingLogKeys.loungePopular.queryKey,
    queryFn: () => getLoungePopular(),
    staleTime: 5 * 60 * 1000, // 5분 (인기도서는 자주 변하지 않으므로)
  });
};

/**
 * 라운지 열성 독서가 조회 (공개 - publicAxios 주입)
 */
export const useLoungeActiveReadersQuery = () => {
  return useQuery({
    queryKey: readingLogKeys.loungeActiveReaders.queryKey,
    queryFn: () => getLoungeActiveReaders(),
    staleTime: 5 * 60 * 1000, // 5분 (자주 변하지 않으므로)
  });
};

/**
 * 특정 도서의 전체 독자 목록 무한 스크롤 (공개 - publicAxios 주입)
 * 상세 모달에서 사용
 */
export const useLoungeBookReadersInfiniteQuery = (
  isbn: string,
  enabled = true,
) => {
  return useInfiniteQuery({
    queryKey: readingLogKeys.loungeBookReaders(isbn).queryKey,
    queryFn: ({ pageParam }) =>
      getLoungeBookReaders(isbn, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: 60 * 1000,
  });
};
