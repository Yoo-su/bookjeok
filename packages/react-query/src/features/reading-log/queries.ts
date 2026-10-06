"use client";

import {
  getLoungeActiveReaders,
  getLoungeBookReaders,
  getLoungeFeed,
  getLoungeMountain,
  getLoungePopular,
  getMyMountainShare,
  getPublicReadingStack,
  getReadingLogBookStatus,
  getReadingLogs,
  getReadingLogSettings,
  getReadingLogsInfinite,
  getReadingStack,
} from "@bookjeok/api-client";
import { CACHE_TIME, readingLogKeys } from "@bookjeok/core";
import {
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";

/**
 * 한 해 독서 기록(날짜 오름차순) 쿼리 옵션. 달력·통계·dock 패널·미리 받기가 같은 캐시를 쓴다.
 * 내 기록은 뮤테이션 무효화로 갱신되므로 미리 받은 것과 같은 신선도로 둔다
 */
export const readingLogsYearQueryOptions = (year: number) =>
  queryOptions({
    queryKey: readingLogKeys.list({ year }).queryKey,
    queryFn: () => getReadingLogs({ year }),
    staleTime: CACHE_TIME.FIVE_MINUTES,
  });

/**
 * 한 해 독서 기록 조회. 월·권수는 부르는 쪽이 이 목록에서 거른다
 */
export const useReadingLogsQuery = (
  params: { year: number },
  options?: {
    enabled?: boolean;
    /** 다른 해를 불러오는 동안 이전 결과를 placeholder로 유지 */
    keepPrevious?: boolean;
  },
) => {
  return useQuery({
    ...readingLogsYearQueryOptions(params.year),
    enabled: options?.enabled,
    placeholderData: options?.keepPrevious ? keepPreviousData : undefined,
  });
};

/**
 * 독서 키재기 조회
 */
export const useReadingStackQuery = (
  year: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: readingLogKeys.stack(year).queryKey,
    queryFn: () => getReadingStack(year),
    enabled: options?.enabled,
  });
};

/**
 * 공개 프로필 독서 키재기 조회
 */
export const usePublicReadingStackQuery = (handle: string, year: number) => {
  return useQuery({
    queryKey: readingLogKeys.publicStack(handle, year).queryKey,
    queryFn: () => getPublicReadingStack(handle, year),
  });
};

/**
 * 내가 이 책을 기록한 이력 조회
 */
export const useReadingLogBookStatusQuery = (
  isbn: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: readingLogKeys.bookStatus(isbn).queryKey,
    queryFn: () => getReadingLogBookStatus(isbn),
    enabled: options?.enabled,
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
 * 북적 책동산 조회 (공개). 기록하면 `readingLogKeys._def` 무효화로 함께 갱신된다
 */
export const useLoungeMountainQuery = () => {
  return useQuery({
    queryKey: readingLogKeys.loungeMountain.queryKey,
    queryFn: () => getLoungeMountain(),
    staleTime: 60 * 1000,
  });
};

/**
 * 책동산에서 내가 쌓은 몫 (인증 필요). 로그인했을 때만 켠다
 */
export const useMyMountainShareQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: readingLogKeys.mountainMine.queryKey,
    queryFn: () => getMyMountainShare(),
    staleTime: 60 * 1000,
    enabled: options?.enabled,
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
