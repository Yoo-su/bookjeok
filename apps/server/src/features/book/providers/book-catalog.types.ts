import { BookInfo, BookSearchField, BookSortParam } from '@bookjeok/core';

/**
 * 도서 서지 공급처 포트.
 *
 * 언제든 갈아끼울 수 있는 바깥 세계를 이 인터페이스 뒤로 숨깁니다.
 * 네이버·알라딘이 연달아 종료된 경험 때문에, 공급처가 또 끊겨도 어댑터
 * 하나만 추가하면 되도록 하는 것이 목적입니다.
 *
 * 구현체는 공급처 고유의 응답 구조를 밖으로 내보내지 않습니다. 반환값은 항상
 * @bookjeok/core의 BookInfo로 정규화합니다.
 */
/**
 * 공급처의 성격. 빈 결과를 어떻게 해석할지가 이 값으로 갈립니다.
 * - external: 외부 공급처. 결과가 없으면 그런 도서가 없다는 뜻입니다.
 * - local: 자체 DB. 결과가 없어도 아직 확보하지 못했다는 뜻일 뿐입니다.
 */
export type BookCatalogProviderKind = 'external' | 'local';

export interface BookCatalogProvider {
  /** 로그와 장애 추적에 쓰는 공급처 이름. */
  readonly name: string;

  /** 빈 결과 해석에 사용합니다. BookCatalogProviderKind를 참고하세요. */
  readonly kind: BookCatalogProviderKind;

  search(params: BookCatalogSearchParams): Promise<BookCatalogSearchResult>;

  findByIsbn(isbn: string): Promise<BookInfo | null>;
}

export interface BookCatalogSearchParams {
  query: string;
  display: number;
  start: number;
  sort: BookSortParam;
  field: BookSearchField;
  /**
   * 소개 전문검색으로 후보를 넓힐지. 기본 true.
   * 입력 중에 부르는 통합 검색 미리보기는 false로 서지(제목·저자·출판사) 인덱스만 쓴다.
   */
  discovery?: boolean;
}

export interface BookCatalogSearchResult {
  total: number;
  start: number;
  display: number;
  items: BookInfo[];
}

/**
 * 검색(키워드) 공급처 체인 주입 토큰. 배열의 순서가 곧 조회 우선순위입니다.
 * 등록은 `book.module.ts` 한 곳에서만 합니다.
 */
export const BOOK_SEARCH_PROVIDERS = Symbol('BOOK_SEARCH_PROVIDERS');

/**
 * 상세(ISBN 단건) 공급처 체인 주입 토큰.
 * 등록 및 체인 순서는 `book.module.ts`에서 관리합니다.
 */
export const BOOK_DETAIL_PROVIDERS = Symbol('BOOK_DETAIL_PROVIDERS');
