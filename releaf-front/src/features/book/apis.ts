import { API_PATHS } from "@/shared/constants/apis";
import { internalAxios, privateAxios, publicAxios } from "@/shared/libs/axios";

import { DEFAULT_DISPLAY, DEFAULT_SORT, DEFAULT_START } from "./constants";
import {
  CommonBookSaleResponse,
  CreateBookSaleParams,
  GetBookDetailErrorResponse,
  GetBookDetailSuccessResponse,
  GetBookListErrorResponse,
  GetBookListParams,
  GetBookListSuccessResponse,
  GetMyBookSalesResponse,
  GetRelatedSalesParams,
  GetRelatedSalesResponse,
  SearchBookSalesParams,
  SearchBookSalesResponse,
  UpdateBookSaleParams,
  UsedBookSale,
} from "./types";

/**
 * 책 검색결과 조회 API
 * @param params
 * @returns
 */
export const getBookList = async (
  params: GetBookListParams
): Promise<GetBookListSuccessResponse | GetBookListErrorResponse> => {
  const displayParam = (params.display ?? DEFAULT_DISPLAY).toString();
  const startParam = (params.start ?? DEFAULT_START).toString();
  const sortParam = params.sort ?? DEFAULT_SORT;

  const { data } = await internalAxios.get(API_PATHS.book.list, {
    params: {
      query: params.query,
      display: displayParam,
      start: startParam,
      sort: sortParam,
    },
  });

  return data;
};

/**
 * 책 상세정보 조회 API
 * @param isbn 책 고유 식별값인 isbn코드
 * @returns
 */
export const getBookDetail = async (
  isbn: string
): Promise<GetBookDetailSuccessResponse | GetBookDetailErrorResponse> => {
  const { data } = await internalAxios.get(API_PATHS.book.detail, {
    params: {
      isbn,
    },
  });

  return data;
};

/**
 * 중고책 판매글 등록 API
 * @param payload
 * @returns
 */
export const createBookSale = async (
  payload: CreateBookSaleParams
): Promise<CommonBookSaleResponse> => {
  const { data } = await privateAxios.post<CommonBookSaleResponse>(
    API_PATHS.book.sale,
    payload
  );

  return data;
};

/**
 * 내가 등록한 중고책 판매글 목록 조회 API
 */
export const getMyBookSales = async (): Promise<GetMyBookSalesResponse> => {
  const { data } = await privateAxios.get<GetMyBookSalesResponse>(
    API_PATHS.book.mySales
  );
  return data;
};

/**
 * 중고책 판매글의 상태를 변경하는 API
 */
export const updateBookSaleStatus = async ({
  saleId,
  status,
}: {
  saleId: number;
  status: string;
}): Promise<CommonBookSaleResponse> => {
  const { data } = await privateAxios.patch<CommonBookSaleResponse>(
    API_PATHS.book.saleStatus(saleId),
    {
      status,
    }
  );
  return data;
};

/** 특정 판매글 상세 정보 조회 API */
export const getBookSaleDetail = async (saleId: string) => {
  const { data } = await publicAxios.get<UsedBookSale>(
    API_PATHS.book.saleDetail(saleId)
  );
  return data;
};

/**
 * 특정 책(ISBN)에 대한 관련 판매글 목록을 페이지네이션으로 조회하는 API 함수
 */
export const getRelatedSales = async ({
  isbn,
  page,
  limit,
  city,
  district,
}: GetRelatedSalesParams): Promise<GetRelatedSalesResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (city) params.append("city", city);
  if (district) params.append("district", district);

  const { data } = await publicAxios.get<GetRelatedSalesResponse>(
    API_PATHS.book.relatedSales(isbn),
    { params }
  );
  return data;
};

/**
 * 중고책 판매글 수정 API
 * @param saleId - 수정할 판매글 ID
 * @param payload - 수정할 데이터
 */
export const updateBookSale = async ({
  saleId,
  payload,
}: {
  saleId: number;
  payload: UpdateBookSaleParams;
}) => {
  const { data } = await privateAxios.patch<CommonBookSaleResponse>(
    API_PATHS.book.updateSale(saleId),
    payload
  );
  return data;
};

/**
 * 중고책 판매글 삭제 API
 @param saleId - 삭제할 판매글 ID
 */
export const deleteBookSale = async (saleId: number) => {
  await privateAxios.delete(API_PATHS.book.deleteSale(saleId));
};

/**
 * 최근 등록된 중고책 판매글 목록 조회 API
 */
export const getRecentBookSales = async (): Promise<UsedBookSale[]> => {
  const { data } = await publicAxios.get<UsedBookSale[]>(
    API_PATHS.book.recentSales
  );
  return data;
};

export const getBookSummary = async (title: string, author: string) => {
  const { data } = await privateAxios.post(API_PATHS.book.summary, {
    title,
    author,
  });
  return data;
};

export const searchBookSales = async (
  params: SearchBookSalesParams
): Promise<SearchBookSalesResponse> => {
  const queryParams = new URLSearchParams();

  // Append all defined parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v));
      } else {
        queryParams.append(key, String(value));
      }
    }
  });

  const queryString = queryParams.toString();
  const url = queryString
    ? `${API_PATHS.book.sales}?${queryString}`
    : API_PATHS.book.sales;

  const { data } = await publicAxios.get<SearchBookSalesResponse>(url);
  return data;
};
