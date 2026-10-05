import {
  AiBookSummaryData,
  API_PATHS,
  BaseBookInfo,
  BookStats,
  DEFAULT_DISPLAY,
  DEFAULT_SORT,
  DEFAULT_START,
  GetBookDetailSuccessResponse,
  GetBookListParams,
  GetBookListSuccessResponse,
  PopularKeyword,
} from "@bookjeok/core";

import { privateApiClient, publicApiClient } from "../../client";

/**
 * 책 검색결과를 조회합니다.
 */
export const getBookList = async (
  params: GetBookListParams,
): Promise<GetBookListSuccessResponse> => {
  const displayParam = (params.display ?? DEFAULT_DISPLAY).toString();
  const startParam = (params.start ?? DEFAULT_START).toString();
  const sortParam = params.sort ?? DEFAULT_SORT;

  const { data } = await publicApiClient.get(API_PATHS.book.list, {
    params: {
      query: params.query,
      display: displayParam,
      start: startParam,
      sort: sortParam,
      queryType: params.queryType,
    },
  });

  return data;
};

/**
 * 책 상세정보를 조회합니다.
 */
export const getBookDetail = async (
  isbn: string,
): Promise<GetBookDetailSuccessResponse> => {
  const { data } = await publicApiClient.get(API_PATHS.book.detail, {
    params: { isbn },
  });

  return data;
};

/**
 * 책 상세페이지 조회수를 기록합니다.
 */
export const recordBookView = async (isbn: string): Promise<void> => {
  await publicApiClient.post(API_PATHS.book.recordView(isbn));
};

/**
 * 인기책 목록을 조회합니다.
 */
export const getPopularBooks = async (): Promise<BaseBookInfo[]> => {
  const { data } = await publicApiClient.get<BaseBookInfo[]>(
    API_PATHS.book.popularBooks,
  );
  return data;
};

/**
 * 저장된 책 요약 정보를 조회합니다.
 * 저장본이 없으면 `null`이고, 조회 실패는 그대로 throw합니다.
 */
export const getSavedBookSummary = async (
  isbn: string,
): Promise<AiBookSummaryData | null> => {
  const { data } = await publicApiClient.get<AiBookSummaryData | null>(
    API_PATHS.llm.getSummary(isbn),
  );
  return data ?? null;
};

/**
 * 책에 대한 요약 및 후기를 생성하거나 조회합니다.
 */
export const getBookSummary = async (
  title: string,
  author: string,
  description?: string,
  isbn?: string,
  publisher?: string,
): Promise<AiBookSummaryData> => {
  const { data } = await privateApiClient.post<AiBookSummaryData>(
    API_PATHS.llm.summary,
    {
      title,
      author,
      description,
      isbn,
      publisher,
    },
  );
  return data;
};

// ===== 인기 검색어 관련 API =====

/**
 * 검색어를 기록합니다.
 */

export const recordSearchKeyword = async (keyword: string): Promise<void> => {
  await publicApiClient.post(API_PATHS.searchKeyword.record, { keyword });
};

/**
 * 인기 검색어 목록을 조회합니다.
 */
export const getPopularKeywords = async (): Promise<PopularKeyword[]> => {
  const { data } = await publicApiClient.get<PopularKeyword[]>(
    API_PATHS.searchKeyword.popular,
  );
  return data;
};

/**
 * 책 통계 정보를 조회합니다 (읽은 유저 수, 위시리스트 유저 수).
 */
export const getBookStats = async (isbn: string): Promise<BookStats> => {
  const { data } = await publicApiClient.get<BookStats>(
    API_PATHS.book.stats(isbn),
  );
  return data;
};
