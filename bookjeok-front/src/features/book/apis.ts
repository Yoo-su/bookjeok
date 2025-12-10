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
 * 책 검색결과를 조회합니다.
 * @param params 검색 파라미터 (검색어, 정렬, 페이징 등)
 * @returns 책 목록 또는 에러 응답
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
 * 책 상세정보를 조회합니다.
 * @param isbn 책 고유 식별값 (ISBN)
 * @returns 책 상세 정보 또는 에러 응답
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
 * 중고책 판매글을 등록합니다.
 * @param payload 판매글 생성 정보
 * @returns 생성된 판매글 정보
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
 * 내가 등록한 중고책 판매글 목록을 조회합니다.
 * @returns 내 판매글 목록
 */
export const getMyBookSales = async (): Promise<GetMyBookSalesResponse> => {
  const { data } = await privateAxios.get<GetMyBookSalesResponse>(
    API_PATHS.book.mySales
  );
  return data;
};

/**
 * 중고책 판매글의 상태(판매중, 예약중, 판매완료)를 변경합니다.
 * @param saleId 판매글 ID
 * @param status 변경할 상태
 * @returns 변경된 판매글 정보
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

/**
 * 특정 판매글의 상세 정보를 조회합니다.
 * @param saleId 판매글 ID
 * @returns 판매글 상세 정보
 */
export const getBookSaleDetail = async (saleId: string) => {
  const { data } = await publicAxios.get<UsedBookSale>(
    API_PATHS.book.saleDetail(saleId)
  );
  return data;
};

/**
 * 특정 책(ISBN)에 대한 관련 판매글 목록을 페이지네이션으로 조회합니다.
 * @param params 조회 파라미터 (ISBN, 페이지, 지역 등)
 * @returns 관련 판매글 목록
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
 * 중고책 판매글을 수정합니다.
 * @param saleId 수정할 판매글 ID
 * @param payload 수정할 데이터
 * @returns 수정된 판매글 정보
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
 * 중고책 판매글을 삭제합니다.
 * @param saleId 삭제할 판매글 ID
 */
export const deleteBookSale = async (saleId: number) => {
  await privateAxios.delete(API_PATHS.book.deleteSale(saleId));
};

/**
 * 최근 등록된 중고책 판매글 목록을 조회합니다.
 * @returns 최근 판매글 목록
 */
export const getRecentBookSales = async (): Promise<UsedBookSale[]> => {
  const { data } = await publicAxios.get<UsedBookSale[]>(
    API_PATHS.book.recentSales
  );
  return data;
};

/**
 * 인기 판매글 목록을 조회합니다.
 */
export const getPopularBookSales = async (): Promise<UsedBookSale[]> => {
  const { data } = await publicAxios.get<UsedBookSale[]>("/book/sales/popular");
  return data;
};

/**
 * 책에 대한 요약 및 후기를 생성하거나 조회합니다.
 * @param title 책 제목
 * @param author 저자
 * @param description 책 설명 (선택)
 * @returns 요약 정보
 */
export const getBookSummary = async (
  title: string,
  author: string,
  description?: string
) => {
  const { data } = await privateAxios.post(API_PATHS.book.summary, {
    title,
    author,
    description,
  });
  return data;
};

/**
 * 중고책 판매글을 검색합니다.
 * @param params 검색 파라미터
 * @returns 검색 결과
 */
export const searchBookSales = async (
  params: SearchBookSalesParams
): Promise<SearchBookSalesResponse> => {
  const queryParams = new URLSearchParams();

  // 정의된 모든 파라미터 추가
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
