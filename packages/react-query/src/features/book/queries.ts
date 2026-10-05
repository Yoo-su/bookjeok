"use client";
import {
  getBookDetail,
  getBookList,
  getBookStats,
  getBookSummary,
  getPopularBooks,
  getPopularKeywords,
  getSavedBookSummary,
} from "@bookjeok/api-client";
import {
  AiBookSummaryData,
  bookKeys,
  DEFAULT_DISPLAY,
  GetBookListParams,
} from "@bookjeok/core";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

/**
 * 책 목록 조회
 */
export const useBookListQuery = (params: GetBookListParams) => {
  return useQuery({
    queryKey: bookKeys.list(params).queryKey,
    queryFn: async () => {
      const result = await getBookList(params);
      return result.items || [];
    },
    staleTime: 1000 * 60 * 5, // 5분 캐시 유지 (하이드레이션 직후 불필요한 재요청 방지)
  });
};

/**
 * 책 상세 조회
 */
export const useBookDetailQuery = (isbn: string) => {
  return useQuery({
    queryKey: bookKeys.detail(isbn).queryKey,
    queryFn: async () => {
      const response = await getBookDetail(isbn);
      return response.items?.[0] || null;
    },
    staleTime: 1000 * 60 * 5, // 5분 캐시 유지 (하이드레이션 직후 불필요한 재요청 방지)
  });
};

/**
 * 책 검색 (무한 스크롤)
 */
export const useInfiniteBookSearch = (query: string) => {
  return useInfiniteQuery({
    queryKey: bookKeys.search(query).queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const params: GetBookListParams = {
        query,
        display: DEFAULT_DISPLAY,
        start: (pageParam - 1) * DEFAULT_DISPLAY + 1,
      };
      const result = await getBookList(params);
      return {
        items: result.items,
        currentPage: pageParam,
        isLastPage: result.items.length < DEFAULT_DISPLAY,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.isLastPage) return undefined;
      return lastPage.currentPage + 1;
    },
    enabled: !!query,
    placeholderData: keepPreviousData,
  });
};

/**
 * 인기책 목록
 */
export const usePopularBooksQuery = () => {
  return useQuery({
    queryKey: bookKeys.popularBooks.queryKey,
    queryFn: () => getPopularBooks(),
  });
};

/**
 * LLM 책 요약 조회 (저장된 정보 조회)
 * 저장본 없음만 `null`로 캐싱하고, 조회 실패는 에러 상태로 남겨 다음 마운트에 재조회합니다.
 */
export const useBookSummaryQuery = (isbn: string) => {
  return useQuery({
    queryKey: bookKeys.summary(isbn).queryKey,
    queryFn: () => getSavedBookSummary(isbn),
    enabled: !!isbn,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useGenerateBookSummaryMutation = (options?: {
  onSuccess?: (data: AiBookSummaryData) => void;
  onError?: (error: unknown) => void;
}) => {
  return useMutation({
    mutationFn: async ({
      title,
      author,
      description,
      isbn,
      publisher,
    }: {
      title: string;
      author: string;
      description?: string;
      isbn?: string;
      publisher?: string;
    }) => {
      return getBookSummary(title, author, description, isbn, publisher);
    },
    ...options,
  });
};

/**
 * 인기 검색어 목록
 */
export const usePopularKeywordsQuery = (staleTime?: number) => {
  return useQuery({
    queryKey: bookKeys.popularKeywords.queryKey,
    queryFn: () => getPopularKeywords(),
    staleTime: staleTime,
  });
};

/**
 * 책 통계 조회
 */
export const useBookStatsQuery = (isbn: string) => {
  return useQuery({
    queryKey: bookKeys.stats(isbn).queryKey,
    queryFn: () => getBookStats(isbn),
    enabled: !!isbn,
  });
};
