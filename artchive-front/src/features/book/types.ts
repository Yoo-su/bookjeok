import { ApiResponse } from "@/shared/types/api";

export type BookSortParam = "sim" | "date";

export interface GetBookListParams {
  query: string;
  display?: number;
  start?: number;
  sort?: BookSortParam;
}

export interface BookInfo {
  title: string;
  link: string;
  image: string;
  author: string;
  discount: string;
  publisher: string;
  pubdate: string;
  isbn: string;
  description: string;
}

/**
 * Book List 조회 관련 타입
 */
export interface GetBookListResponseData {
  display: number;
  items: BookInfo[];
  lastBuildDate: string;
  start: number;
  total: number;
}
export type GetBookListSuccessResponse = ApiResponse<GetBookListResponseData>;

export interface GetBookListErrorResponse {
  success: false;
  message: string;
}

/**
 * Book Detail 조회 관련 타입
 */
export interface GetBookDetailResponseData {
  display: number;
  items: BookInfo[];
  lastBuildDate: string;
  start: number;
  total: number;
}

export type GetBookDetailSuccessResponse =
  ApiResponse<GetBookDetailResponseData>;

export interface GetBookDetailErrorResponse {
  success: false;
  message: string;
}

export interface CreateBookSaleParams {
  title: string;
  price: string;
  city: string;
  district: string;
  content: string;
  imageUrls: string[];
  book: {
    isbn: string;
    title: string;
    description: string;
    author: string;
    publisher: string;
    image: string;
    pubdate: string;
  };
}

/**
 * 중고책 판매글의 상태를 나타내는 Enum
 * - NestJS의 SaleStatus Enum과 일치해야 합니다.
 */
export enum SaleStatus {
  FOR_SALE = "FOR_SALE",
  RESERVED = "RESERVED",
  SOLD = "SOLD",
}

/**
 * 판매글 작성자의 공개 프로필 정보
 * - NestJS의 User 엔티티에서 외부에 노출될 필드만 포함합니다.
 */
export interface SaleAuthor {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
}

/**
 * 중고책 판매 게시글의 전체 데이터 구조를 나타내는 타입
 */
export interface UsedBookSale {
  id: number;
  title: string;
  price: number;
  city: string;
  district: string;
  content: string;
  imageUrls: string[];
  status: SaleStatus;
  createdAt: string; // ISO 8601 형식의 날짜 문자열
  updatedAt: string; // ISO 8601 형식의 날짜 문자열
  user: SaleAuthor; // 작성자 정보 (중첩 객체)
  book: BookInfo; // 책 정보 (중첩 객체)
}

// 책 관련 판매게시글 목록 조회 API 요청 파라미터 타입
export interface GetRelatedSalesParams {
  isbn: string;
  page: number;
  limit: number;
  city?: string;
  district?: string;
}

// 책 관련 판매게시글 목록 API 응답 타입 (NestJS 응답과 일치)
export interface GetRelatedSalesResponse {
  sales: UsedBookSale[];
  total: number;
  page: number;
  hasNextPage: boolean;
}

export interface UseInfiniteRelatedSalesQueryProps {
  isbn: string;
  city?: string;
  district?: string;
  limit?: number;
}

// 판매글 수정을 위한 타입. 모든 필드는 선택적(optional)입니다.
export type UpdateBookSaleParams = Partial<{
  title: string;
  price: number;
  city: string;
  district: string;
  content: string;
  imageUrls: string[];
}>;

export type CommonBookSaleResponse = ApiResponse<UsedBookSale>;

export type GetMyBookSalesResponse = ApiResponse<UsedBookSale[]>;

export interface SearchBookSalesParams {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: SaleStatus[];
  sortBy?: string; // 'createdAt' | 'price'
  sortOrder?: string; // 'ASC' | 'DESC'
}

export interface SearchBookSalesResponse {
  sales: UsedBookSale[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}
