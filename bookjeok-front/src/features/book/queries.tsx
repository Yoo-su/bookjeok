import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/query-keys";

import {
  getBookDetail,
  getBookList,
  getBookSaleDetail,
  getBookSummary,
  getMyBookSales,
  getPopularBooks,
  getPopularBookSales,
  getRecentBookSales,
  getRelatedSales,
  searchBookSales,
} from "./apis";
import { DEFAULT_DISPLAY } from "./constants";
import {
  BookInfo,
  GetBookListParams,
  SearchBookSalesParams,
  UseInfiniteRelatedSalesQueryProps,
} from "./types";

/**
 * 책 목록 조회
 */
export const useBookListQuery = (params: GetBookListParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.list(params).queryKey,
    queryFn: async () => {
      const result = await getBookList(params);
      if (!result.success) return [] as BookInfo[];
      return result.items;
    },
  });
};

/**
 * 책 상세 조회
 */
export const useBookDetailQuery = (isbn: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.detail(isbn).queryKey,
    queryFn: async () => {
      const response = await getBookDetail(isbn);
      if (!response.success) return null;
      return response.items[0];
    },
  });
};

/**
 * 책 검색 (무한 스크롤)
 */
export const useInfiniteBookSearch = (query: string) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.bookKeys.search(query).queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const params: GetBookListParams = {
        query,
        display: DEFAULT_DISPLAY,
        start: (pageParam - 1) * DEFAULT_DISPLAY + 1,
      };
      const result = await getBookList(params);
      if (!result.success) {
        throw new Error("Failed to fetch book list");
      }
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
  });
};

/**
 * 판매글 검색 (무한 스크롤)
 */
export const useInfiniteBookSalesQuery = (params: SearchBookSalesParams) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.bookKeys.marketSales(params).queryKey,
    queryFn: ({ pageParam = 1 }) =>
      searchBookSales({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasNextPage ? allPages.length + 1 : undefined;
    },
  });
};

/**
 * 내 판매글 목록 (내 데이터 - 짧은 staleTime)
 */
export const useMyBookSalesQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.mySales.queryKey,
    queryFn: async () => {
      const result = await getMyBookSales();
      return result;
    },
    staleTime: 30 * 1000,
  });
};

/**
 * 판매글 상세 조회
 */
export const useBookSaleDetailQuery = (saleId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.saleDetail(saleId).queryKey,
    queryFn: async () => {
      const result = await getBookSaleDetail(saleId);
      return result;
    },
    enabled: !!saleId,
  });
};

/**
 * 관련 판매글 (무한 스크롤)
 */
export const useInfiniteRelatedSalesQuery = ({
  isbn,
  city,
  district,
  limit = 10,
  enabled = true,
}: UseInfiniteRelatedSalesQueryProps) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.bookKeys.relatedSales({ isbn, city, district, limit })
      .queryKey,
    queryFn: ({ pageParam = 1 }) =>
      getRelatedSales({ isbn, page: pageParam, limit, city, district }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasNextPage ? allPages.length + 1 : undefined;
    },
    enabled: !!isbn && enabled,
  });
};

/**
 * 관련 판매글 (제한된 개수)
 */
export const useRelatedSalesQuery = ({
  isbn,
  limit = 4,
  enabled = true,
}: {
  isbn: string;
  limit?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.relatedSales({ isbn, limit }).queryKey,
    queryFn: () => getRelatedSales({ isbn, page: 1, limit }),
    enabled: !!isbn && enabled,
  });
};

/**
 * 최근 판매글 목록
 */
export const useRecentBookSalesQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.recentSales.queryKey,
    queryFn: getRecentBookSales,
  });
};

/**
 * 인기 판매글 목록
 */
export const usePopularBookSalesQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.popularSales.queryKey,
    queryFn: getPopularBookSales,
  });
};

/**
 * 인기책 목록
 */
export const usePopularBooksQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.popularBooks.queryKey,
    queryFn: getPopularBooks,
  });
};

/**
 * LLM 책 요약 조회
 */
export const useBookSummaryQuery = (
  title: string,
  author: string,
  enabled: boolean,
  description?: string
) => {
  return useQuery({
    queryKey: ["bookSummary", title, author],
    queryFn: async () => {
      const result = await getBookSummary(title, author, description);
      if (!result.success) {
        throw new Error(result.message || "요약 정보를 가져오지 못했습니다.");
      }
      return result;
    },
    enabled: enabled,
    retry: false,
  });
};
