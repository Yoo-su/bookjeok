export type BookSortParam = "sim" | "date";

/**
 * 도서 검색 대상 필드. 특정 공급처에 종속되지 않는 중립 타입입니다.
 * 값의 대소문자는 API 하위호환을 위해 유지하며, 공급처별 파라미터명 변환은
 * 각 어댑터가 책임집니다.
 */
export type BookSearchField = "Keyword" | "Title" | "Author" | "Publisher";

export interface GetBookListParams {
  query: string;
  display?: number;
  start?: number;
  sort?: BookSortParam;
  queryType?: BookSearchField;
}

/**
 * 책 정보의 공통 필드 (백엔드 DB 및 UI 컴포넌트 모두에서 사용)
 * - 슬라이더, 카드 등 UI 컴포넌트에서 필요한 최소 필드
 */
export interface BaseBookInfo {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  description: string;
  image: string;
}

/**
 * 서비스 표준 도서 정보 형태. 어느 공급처에서 왔든 이 형태로 정규화됩니다.
 * `link`와 `pubdate`는 공급처에 따라 없을 수 있어 옵셔널입니다.
 */
export interface BookInfo extends BaseBookInfo {
  link?: string;
  discount: string;
  pubdate?: string;
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
export type GetBookListSuccessResponse = GetBookListResponseData;

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

export type GetBookDetailSuccessResponse = GetBookDetailResponseData;

export interface GetBookDetailErrorResponse {
  success: false;
  message: string;
}

export interface BookStats {
  readingUserCount: number;
  wishlistUserCount: number;
}

export interface AiBookSummaryData {
  isbn: string;
  summary: string;
  keyPoints: string[];
  targetAudience: string;
  keywords: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 실시간 인기 검색어 항목
 */
export interface PopularKeyword {
  keyword: string;
  searchCount: number;
}

/**
 * AI 도서 검색/추천 결과 도서 아이템
 */
export interface AiSearchBookItem {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  description: string;
  image: string;
  similarity: number;
  reason?: string;
}

/**
 * AI 도서 대화 SSE(Server-Sent Events) 스트림 이벤트
 */
export type AiSearchSseEvent =
  | { type: "searching"; message: string }
  | { type: "books"; books: AiSearchBookItem[] }
  | { type: "text"; chunk: string }
  | { type: "done" }
  | { type: "error"; message: string };
