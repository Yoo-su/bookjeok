import { BookInfo } from "../book/types";

export interface ReadingLog {
  id: string;
  userId: number;
  isbn: string;
  book: BookInfo;
  date: string; // YYYY-MM-DD
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReadingLogParams {
  isbn: string;
  date: string;
  memo?: string;
}

export interface ReadingLogStats {
  monthlyCount: number;
  yearlyCount: number;
}

export interface ReadingLogListResponse {
  items: ReadingLog[];
  nextCursor: string | null;
}

export interface UpdateReadingLogParams {
  id: string;
  memo: string;
  date?: string; // YYYY-MM-DD
}

/**
 * 독서 기록 공개 설정
 */
export interface ReadingLogSettings {
  isReadingLogPublic: boolean;
}

/** 라운지 피드에서 한 명의 독자를 나타내는 타입 */
export interface LoungeReader {
  userId: number;
  nickname: string;
  handle: string;
  profileImageUrl: string | null;
  date: string; // YYYY-MM-DD (가장 최근 읽은 날짜)
  memo?: string;
}

/** 라운지 피드의 개별 카드 (책 단위 그룹) */
export interface LoungeBookCard {
  isbn: string;
  book: BookInfo;
  latestDate: string; // 이 책의 가장 최근 독서 날짜
  readers: LoungeReader[]; // 최근 독자 목록 (최대 5명)
  totalReaderCount: number; // 전체 독자 수
}

/** 라운지 피드 API 응답 (커서 기반 페이지네이션) */
export interface LoungeFeedResponse {
  items: LoungeBookCard[];
  nextCursor: string | null; // "YYYY-MM-DD|isbn" 형태
}

/** 라운지 인기 도서 카드 */
export interface LoungePopularBook {
  isbn: string;
  book: BookInfo;
  readerCount: number;
  recentReaders: Pick<
    LoungeReader,
    "nickname" | "handle" | "profileImageUrl"
  >[];
}

/** 라운지 인기 도서 API 응답 */
export interface LoungePopularResponse {
  items: LoungePopularBook[];
}

/** 특정 도서의 독자 목록 API 응답 (상세 모달용, 커서 기반 페이지네이션) */
export interface LoungeBookReadersResponse {
  book: BookInfo;
  items: LoungeReader[];
  nextCursor: string | null; // "userId" 형태
  totalCount: number;
}

/** 라운지 열성 독서가 정보 */
export interface ActiveReader {
  user: {
    id: number;
    nickname: string;
    handle: string;
    profileImageUrl: string | null;
  };
  recentCount: number;
  totalCount: number;
}

/** 라운지 열성 독서가 API 응답 */
export interface ActiveReadersResponse {
  items: ActiveReader[];
}
