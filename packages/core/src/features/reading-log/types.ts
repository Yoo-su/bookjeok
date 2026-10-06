import { BookInfo } from "../book/types";
import type { MountainLandmarkId } from "./mountain";

/** 독서 기록에 붙는 책. 목록 응답은 소개글처럼 큰 열을 빼고 이 필드만 담는다 */
export type ReadingLogBook = Pick<
  BookInfo,
  "isbn" | "title" | "author" | "publisher" | "image"
>;

export interface ReadingLog {
  id: string;
  userId: number;
  isbn: string;
  book: ReadingLogBook;
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

/** 책동산 지층 띠 하나. 바닥부터 올린 순서 */
export interface LoungeMountainBand {
  mm: number;
  /** 대표 표지색(#rrggbb). 표지색이 없는 책은 서버가 대체색을 고른다 */
  color: string;
}

/** 책동산 꼭대기에 막 올라온 기록 */
export interface LoungeMountainBook {
  logId: string;
  isbn: string;
  title: string;
  author: string;
  /** 눕힌 책의 가로(책의 세로, mm) */
  height: number;
  /** 두께(mm) */
  depth: number;
  coverColor: string | null;
  /** 기록한 시각(ISO). 독서 날짜가 아니라 책동산에 올라간 때 */
  addedAt: string;
  reader: Pick<LoungeReader, "nickname" | "handle" | "profileImageUrl">;
}

/** 책동산이 넘은 이정표와 넘긴 기록 */
export interface LoungeMountainMilestone {
  landmark: MountainLandmarkId;
  reachedAt: string;
  isbn: string;
  title: string;
  reader: Pick<LoungeReader, "nickname" | "handle">;
}

/** 북적 책동산 API 응답. 공개 설정 사용자의 기록만 쌓는다 */
export interface LoungeMountainResponse {
  totalMm: number;
  bookCount: number;
  readerCount: number;
  /** 최근 MOUNTAIN_WEEK_DAYS일 동안 올라간 높이·권수 */
  weekMm: number;
  weekCount: number;
  /** 바닥부터. 꼭대기 쪽이 최근 기록 */
  bands: LoungeMountainBand[];
  /** 최근 것부터, 최대 MOUNTAIN_PEAK_COUNT권 */
  peak: LoungeMountainBook[];
  /** 낮은 이정표부터 */
  milestones: LoungeMountainMilestone[];
}

/** 책동산에서 내가 쌓은 몫. 비공개 설정이면 내 기록이 산에 없으므로 0권이다 */
export interface MyMountainShareResponse {
  myMm: number;
  myCount: number;
  /** 같은 시점의 책동산 전체 높이. 비율은 이 값으로 나눈다 */
  totalMm: number;
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
