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
 * 책 목록을 조회하는 쿼리 훅입니다.
 * @param params 조회 파라미터
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
 * 책 상세 정보를 조회하는 쿼리 훅입니다.
 * @param isbn 책 ISBN
 */
export const useBookDetailQuery = (isbn: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.detail(isbn).queryKey,
    queryFn: async () => {
      const response = await getBookDetail(isbn);

      if (!response.success) return null;
      return response.items[0];
    },
    staleTime: Infinity,
  });
};

/**
 * 책 검색을 위한 무한 스크롤 쿼리 훅입니다.
 * @param query 검색어
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
        // API가 전체 페이지 수를 주지 않으므로, 받아온 아이템 수가 요청한 수보다 적으면 마지막 페이지로 간주
        isLastPage: result.items.length < DEFAULT_DISPLAY,
      };
    },
    initialPageParam: 1, // 첫 페이지는 1
    getNextPageParam: (lastPage) => {
      // 마지막 페이지라면 더 이상 다음 페이지가 없음을 알립니다 (undefined 반환)
      if (lastPage.isLastPage) return undefined;
      return lastPage.currentPage + 1;
    },
    enabled: !!query, // query가 있을 때만 쿼리를 실행합니다.
  });
};

/**
 * 판매글 검색을 위한 무한 스크롤 쿼리 훅입니다.
 * @param params 검색 파라미터
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
    staleTime: 60 * 5 * 1000, // 5분
  });
};

/**
 * 내 판매글 목록을 조회하는 쿼리 훅입니다.
 */
export const useMyBookSalesQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.mySales.queryKey,
    queryFn: async () => {
      const result = await getMyBookSales();
      return result;
    },
  });
};

/**
 * 판매글 ID를 받아 상세 정보를 조회하는 쿼리 훅입니다.
 * @param saleId 조회할 판매글의 ID
 */
export const useBookSaleDetailQuery = (saleId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.saleDetail(saleId).queryKey,
    queryFn: async () => {
      const result = await getBookSaleDetail(saleId);

      return result;
    },
    // saleId가 유효한 문자열일 경우에만 쿼리를 실행합니다.
    enabled: !!saleId,
  });
};

/**
 * 관련 판매글 목록을 조회하는 무한 스크롤 쿼리 훅입니다.
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
    enabled: !!isbn && enabled, // isbn이 있고 enabled일 때만 쿼리 실행
    staleTime: 0,
  });
};

/**
 * 관련 판매글 목록을 조회하는 쿼리 훅입니다. (제한된 개수)
 * @param isbn 책 ISBN
 * @param limit 조회할 개수 (기본 4개)
 * @param enabled 쿼리 활성화 여부
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
    staleTime: 5 * 60 * 1000, // 5분
  });
};

/**
 * 최근 중고책 판매글 목록을 조회하는 쿼리 훅입니다.
 */
export const useRecentBookSalesQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.recentSales.queryKey,
    queryFn: getRecentBookSales,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

/**
 * 인기 중고책 판매글 목록을 조회하는 쿼리 훅입니다.
 */
export const usePopularBookSalesQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.popularSales.queryKey,
    queryFn: getPopularBookSales,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

/**
 * 인기책 목록을 조회하는 쿼리 훅입니다.
 * 조회수, 판매글, 리뷰 데이터 기반으로 계산됩니다.
 */
export const usePopularBooksQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.popularBooks.queryKey,
    queryFn: getPopularBooks,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

/**
 * LLM을 통해 생성된 책 요약/후기 정보를 조회하는 쿼리 훅입니다.
 * @param title 책 제목
 * @param author 저자
 * @param enabled 쿼리 자동 실행 여부
 * @param description 책 설명
 */
export const useBookSummaryQuery = (
  title: string,
  author: string,
  enabled: boolean,
  description?: string
) => {
  return useQuery({
    // title과 author를 queryKey에 포함시켜 책마다 캐시되도록 함
    queryKey: ["bookSummary", title, author],
    queryFn: async () => {
      const result = await getBookSummary(title, author, description);
      if (!result.success) {
        throw new Error(result.message || "요약 정보를 가져오지 못했습니다.");
      }
      return result;
    },
    enabled: enabled, // book 데이터 로딩이 완료되었을 때만 이 쿼리를 실행
    staleTime: Infinity, // 한 번 가져온 요약 정보는 바뀌지 않으므로 fresh 상태 유지
    retry: false, // 실패 시 자동 재시도 비활성화
  });
};
