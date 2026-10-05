import { SortBy, SortOption, SortOrder } from "./types";

/**
 * 유효한 sortBy 값 목록 (정적 배열)
 */
export const VALID_SORT_BY_LIST: SortBy[] = ["createdAt", "price", "title"];

/**
 * 유효한 sortOrder 값 목록 (정적 배열)
 */
export const VALID_SORT_ORDER_LIST: SortOrder[] = ["ASC", "DESC"];

/**
 * 유효한 SaleStatus 값 목록 (정적 배열)
 */
export const VALID_SALE_STATUSES_LIST = ["SALE", "RESERVED", "SOLD"] as const;

// 판매글 입력 제한
export const SALE_TITLE_MIN_LENGTH = 5;
export const SALE_TITLE_MAX_LENGTH = 50;
export const SALE_CONTENT_MIN_LENGTH = 10;
export const SALE_CONTENT_MAX_LENGTH = 1000;
export const SALE_IMAGE_MAX_COUNT = 5;

// 중고책 마켓 필터 및 정렬 상수
export const MAX_MARKET_PRICE = 100000;
export const FILTER_ALL = "all" as const;

export const DEFAULT_SORT_BY: SortBy = "createdAt";
export const DEFAULT_SORT_ORDER: SortOrder = "DESC";
export const DEFAULT_SORT_OPTION: SortOption = "createdAt_DESC";

// 런타임 검증용 Set
export const VALID_SORT_BY: ReadonlySet<string> = new Set(VALID_SORT_BY_LIST);
export const VALID_SORT_ORDER: ReadonlySet<string> = new Set(
  VALID_SORT_ORDER_LIST,
);
export const VALID_SALE_STATUSES: ReadonlySet<string> = new Set(
  VALID_SALE_STATUSES_LIST,
);
