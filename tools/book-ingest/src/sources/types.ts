import type { BookDimensions } from "../dimensions";
import type { Candidate, Normalized } from "../normalize";

export interface SourcePage<Raw> {
  items: Raw[];
  totalCount: number;
  /** 더 받을 페이지가 없으면 true. 공급처마다 판단 근거가 다릅니다. */
  isEnd: boolean;
}

/** 자유 검색의 대상 필드. ISBN은 입력 모양으로 정합니다(`parseKeywordQuery`). */
export type SearchField = "all" | "title" | "author" | "isbn";
export type SearchSort = "accuracy" | "latest";

export interface KeywordQuery {
  text: string;
  field: SearchField;
  sort: SearchSort;
}

/**
 * 도서 공급처. 스캔·적재 코어는 이 계약만 봅니다.
 * 공급처 고유의 응답 형태·정제 규칙·페이지 함정은 전부 구현 파일 안에 둡니다.
 */
export interface BookSource<Raw = unknown> {
  id: string;
  label: string;
  /** 검색이 실제로 돌려주는 페이지 상한. 넘기면 앞 페이지를 반복합니다. 자유 검색도 같습니다. */
  maxPages: number;
  /** 출판사별 최신순 목록. */
  searchPublisher(publisher: string, page: number): Promise<SourcePage<Raw>>;
  /** 자유 검색. 출판사를 가리지 않습니다. */
  searchKeyword(query: KeywordQuery, page: number): Promise<SourcePage<Raw>>;
  /** `expectedPublisher`가 null이면 출판사를 대조하지 않습니다. */
  normalize(
    raw: Raw,
    expectedPublisher: string | null,
    today: string,
  ): Normalized;
  /** 적재 직전에 한 권씩 부르는 보강 조회. 검색 응답에 없는 값을 채웁니다. */
  enrich?(book: Candidate): Promise<Candidate>;
  /**
   * ISBN으로 실측 판형을 찾습니다. 판형을 주지 않는 다른 공급처의 책에 빌려 줍니다.
   * 공급처에 없는 책이면 null, 조회 자체가 실패하면 던집니다.
   */
  lookupDimensions?(isbn: string): Promise<BookDimensions | null>;
}

export interface SourceDefinition {
  id: string;
  label: string;
  /** 이 키가 있어야 쓸 수 있습니다. 없으면 화면에서 비활성으로 보입니다. */
  envKey: string;
  maxPages: number;
  /** 화면이 미리보기 표지를 불러오는 출처. CSP `img-src`에 들어갑니다. */
  imageOrigins: string[];
  /** 적재 직전 보강 조회를 하는 공급처라면 화면에 보여 줄 안내. */
  enrichNote?: string;
  create(apiKey: string): BookSource;
}
