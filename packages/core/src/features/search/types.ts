/**
 * 상단바 통합 검색 미리보기(`GET /search/preview?q=`) 응답.
 * 입력 중에 부르는 가벼운 조회라 영역마다 몇 건만 담고 전체 건수를 함께 준다.
 */

/** 이보다 짧은 검색어는 미리보기를 하지 않는다. 한 글자는 거의 모든 책에 걸린다 */
export const SEARCH_PREVIEW_MIN_LENGTH = 2;

/** 검색어 최대 길이. 넘으면 400 */
export const SEARCH_PREVIEW_MAX_LENGTH = 100;

export const SEARCH_PREVIEW_LIMITS = { books: 4, reviews: 3, sales: 3 } as const;

export interface SearchPreviewBook {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  image: string | null;
  /** 이 책의 공개 리뷰 수 */
  reviewCount: number;
  /** 이 책의 판매중·예약중 판매글 수 */
  saleCount: number;
}

export interface SearchPreviewReview {
  id: number;
  title: string;
  /** 본문(HTML)을 순수 텍스트로 바꿔 검색어 주변을 잘라 낸 것 */
  snippet: string;
  rating: number;
  nickname: string;
  bookTitle: string;
}

export interface SearchPreviewSale {
  id: number;
  title: string;
  price: number;
  status: "FOR_SALE" | "RESERVED";
  /** 판매 도서의 표지 */
  image: string | null;
  bookTitle: string;
  /** 「서울 마포구」처럼 시·구를 합친 지역 */
  region: string | null;
}

export interface SearchPreviewSection<T> {
  items: T[];
  total: number;
}

export interface SearchPreview {
  books: SearchPreviewSection<SearchPreviewBook>;
  reviews: SearchPreviewSection<SearchPreviewReview>;
  sales: SearchPreviewSection<SearchPreviewSale>;
}
