import {
  ActiveReadersResponse,
  API_PATHS,
  CreateReadingLogParams,
  LoungeBookReadersResponse,
  LoungeFeedResponse,
  LoungePopularResponse,
  ReadingLog,
  ReadingLogBookStatus,
  ReadingLogListResponse,
  ReadingLogSettings,
  ReadingLogStats,
  ReadingStackResponse,
  UpdateReadingLogParams,
} from "@bookjeok/core";

import { privateApiClient, publicApiClient } from "../../client";

/**
 * 독서 기록 목록을 조회합니다.
 */
export const getReadingLogs = async (params?: {
  year?: number;
  month?: number;
  limit?: number;
}): Promise<ReadingLog[]> => {
  const { data } = await privateApiClient.get<ReadingLog[]>(
    API_PATHS.readingLog.base,
    {
      params,
    },
  );
  return data;
};

/**
 * 독서 기록 목록을 무한 스크롤로 조회합니다.
 */
export const getReadingLogsInfinite = async (
  pageParam: string | null = null,
): Promise<ReadingLogListResponse> => {
  const { data } = await privateApiClient.get<ReadingLogListResponse>(
    API_PATHS.readingLog.list,
    {
      params: { cursorId: pageParam },
    },
  );
  return data;
};

/**
 * 독서 기록을 생성합니다.
 */
export const createReadingLog = async (
  payload: CreateReadingLogParams,
  options?: { idempotencyKey?: string },
): Promise<ReadingLog> => {
  const config = options?.idempotencyKey
    ? { headers: { "x-idempotency-key": options.idempotencyKey } }
    : undefined;
  const response = await privateApiClient.post<ReadingLog>(
    API_PATHS.readingLog.base,
    payload,
    config,
  );
  return response.data;
};

/**
 * 독서 기록을 수정합니다.
 */
export const updateReadingLog = async ({
  id,
  memo,
  date,
}: UpdateReadingLogParams): Promise<ReadingLog> => {
  const response = await privateApiClient.patch<ReadingLog>(
    API_PATHS.readingLog.detail(id),
    { memo, date },
  );
  return response.data;
};

/**
 * 독서 기록을 삭제합니다.
 */
export const deleteReadingLog = async (id: string): Promise<void> => {
  await privateApiClient.delete(API_PATHS.readingLog.detail(id));
};

/**
 * 독서 기록 통계를 조회합니다.
 */
export const getReadingLogStats = async (params: {
  year: number;
  month: number;
}): Promise<ReadingLogStats> => {
  const response = await privateApiClient.get<ReadingLogStats>(
    API_PATHS.readingLog.stats,
    { params },
  );
  return response.data;
};

/**
 * 독서 키재기(한 해의 독서 기록을 책 크기와 함께) 조회합니다.
 */
export const getReadingStack = async (
  year: number,
): Promise<ReadingStackResponse> => {
  const { data } = await privateApiClient.get<ReadingStackResponse>(
    API_PATHS.readingLog.stack,
    { params: { year } },
  );
  return data;
};

/**
 * 다른 사용자의 독서 키재기를 조회합니다. 독서 기록이 비공개면 빈 목록입니다.
 */
export const getPublicReadingStack = async (
  handle: string,
  year: number,
): Promise<ReadingStackResponse> => {
  const { data } = await publicApiClient.get<ReadingStackResponse>(
    API_PATHS.readingLog.publicStack(handle),
    { params: { year } },
  );
  return data;
};

/**
 * 내가 이 책을 기록한 횟수와 마지막 날짜를 조회합니다.
 */
export const getReadingLogBookStatus = async (
  isbn: string,
): Promise<ReadingLogBookStatus> => {
  const { data } = await privateApiClient.get<ReadingLogBookStatus>(
    API_PATHS.readingLog.bookStatus(isbn),
  );
  return data;
};

/**
 * 독서 기록 설정을 조회합니다.
 */
export const getReadingLogSettings = async (): Promise<ReadingLogSettings> => {
  const response = await privateApiClient.get<ReadingLogSettings>(
    API_PATHS.readingLog.settings,
  );
  return response.data;
};

/**
 * 독서 기록 설정을 수정합니다.
 */
export const updateReadingLogSettings = async (
  isReadingLogPublic: boolean,
): Promise<ReadingLogSettings> => {
  const response = await privateApiClient.patch<ReadingLogSettings>(
    API_PATHS.readingLog.settings,
    {
      isReadingLogPublic,
    },
  );
  return response.data;
};

/**
 * 라운지 피드를 조회합니다. (공개 API - 인증 불필요)
 * 모든 공개 사용자의 독서 기록을 책 단위로 그룹화하여 반환합니다.
 */
export const getLoungeFeed = async (
  cursor: string | null = null,
): Promise<LoungeFeedResponse> => {
  const { data } = await publicApiClient.get<LoungeFeedResponse>(
    API_PATHS.readingLog.loungeFeed,
    {
      params: { cursor },
    },
  );
  return data;
};

/**
 * 라운지 인기 도서를 조회합니다. (공개 API - 인증 불필요)
 * 최근 30일간 가장 많이 읽힌 도서 Top 10을 반환합니다.
 */
export const getLoungePopular = async (): Promise<LoungePopularResponse> => {
  const { data } = await publicApiClient.get<LoungePopularResponse>(
    API_PATHS.readingLog.loungePopular,
  );
  return data;
};

/**
 * 라운지 열성 독서가 목록을 조회합니다. (공개 API - 인증 불필요)
 */
export const getLoungeActiveReaders =
  async (): Promise<ActiveReadersResponse> => {
    const { data } = await publicApiClient.get<ActiveReadersResponse>(
      API_PATHS.readingLog.loungeActiveReaders,
    );
    return data;
  };

/**
 * 특정 도서의 전체 독자 목록을 조회합니다. (공개 API - 인증 불필요)
 * 상세 모달에서 무한 스크롤로 사용됩니다.
 */
export const getLoungeBookReaders = async (
  isbn: string,
  cursor: string | null = null,
): Promise<LoungeBookReadersResponse> => {
  const { data } = await publicApiClient.get<LoungeBookReadersResponse>(
    API_PATHS.readingLog.loungeBookReaders(isbn),
    {
      params: { cursor },
    },
  );
  return data;
};
