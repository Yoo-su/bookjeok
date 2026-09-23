import type { Candidate, Normalized } from "../normalize";

export interface SourcePage<Raw> {
  items: Raw[];
  totalCount: number;
  /** 더 받을 페이지가 없으면 true. 공급처마다 판단 근거가 다릅니다. */
  isEnd: boolean;
}

/**
 * 출판사별 최신순 목록을 주는 도서 공급처. 스캔·적재 코어는 이 계약만 봅니다.
 * 공급처 고유의 응답 형태·정제 규칙·페이지 함정은 전부 구현 파일 안에 둡니다.
 */
export interface BookSource<Raw = unknown> {
  id: string;
  label: string;
  /** 출판사 검색이 실제로 돌려주는 페이지 상한. 넘기면 앞 페이지를 반복합니다. */
  maxPages: number;
  search(publisher: string, page: number): Promise<SourcePage<Raw>>;
  normalize(raw: Raw, expectedPublisher: string, today: string): Normalized;
  /** 적재 직전에 한 권씩 부르는 보강 조회. 검색 응답에 없는 값을 채웁니다. */
  enrich?(book: Candidate): Promise<Candidate>;
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
