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

/** 내가 한 책을 기록한 이력. 「읽었어요」 폼이 재독 여부를 알린다 */
export interface ReadingLogBookStatus {
  count: number;
  /** 가장 최근 기록일(YYYY-MM-DD). 기록이 없으면 null */
  lastDate: string | null;
}

export interface UpdateReadingLogParams {
  id: string;
  memo: string;
  date?: string; // YYYY-MM-DD
}

/** 책 크기의 출처. 알라딘 실측값이 없으면 서버가 추정한다 */
export type BookSizeSource = "measured" | "estimated";

/**
 * 독서 키재기에 쌓이는 책 한 권(독서 기록 1건).
 * 크기는 mm, 무게는 g. 눕혀 쌓으므로 쌓은 모습에서는 height가 가로, depth가 높이가 된다.
 */
export interface ReadingStackBook {
  logId: string;
  isbn: string;
  date: string; // YYYY-MM-DD
  memo?: string;
  title: string;
  author: string;
  publisher: string;
  image: string;
  width: number;
  height: number;
  depth: number;
  pages: number | null;
  weight: number;
  binding: string | null;
  /** 표지 대표색(#rrggbb). 없으면 화면이 기본색으로 칠한다 */
  coverColor: string | null;
  sizeSource: BookSizeSource;
}

/** 독서 키재기 API 응답. items는 완독일 오름차순(바닥부터 쌓는 순서) */
export interface ReadingStackResponse {
  year: number;
  items: ReadingStackBook[];
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
