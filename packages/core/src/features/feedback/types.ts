/**
 * 문의·제보 종류
 */
export enum FeedbackType {
  BOOK_REQUEST = "BOOK_REQUEST",
  BUG = "BUG",
  SUGGESTION = "SUGGESTION",
  OTHER = "OTHER",
}

/**
 * 문의·제보 처리 상태
 */
export enum FeedbackStatus {
  RECEIVED = "RECEIVED",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  WONT_FIX = "WONT_FIX",
}

/**
 * 문의·제보 작성 요청
 * - 책 요청은 bookTitle 필수, content 선택
 * - 나머지 종류는 content 필수
 */
export interface CreateFeedbackParams {
  type: FeedbackType;
  content?: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookPublisher?: string;
  /** 제보를 연 페이지 (경로 + 쿼리) */
  pagePath?: string;
}

export interface CreateFeedbackResponse {
  id: number;
}

export interface FeedbackBook {
  title: string;
  author: string | null;
  publisher: string | null;
}

/**
 * 작성자 본인이 보는 문의
 * - 운영자 메모·기기 정보는 담지 않는다
 */
export interface MyFeedback {
  id: number;
  type: FeedbackType;
  status: FeedbackStatus;
  content: string;
  /** 책 요청일 때만 */
  book: FeedbackBook | null;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export interface AdminFeedbackUser {
  id: number;
  nickname: string;
  handle: string;
}

/**
 * 운영자가 보는 문의
 */
export interface AdminFeedback extends MyFeedback {
  /** 작성자가 탈퇴하면 null */
  user: AdminFeedbackUser | null;
  pagePath: string | null;
  userAgent: string | null;
  adminNote: string | null;
  updatedAt: string;
}

export interface FeedbackListResponse<T> {
  items: T[];
  nextCursor: number | null;
}

export interface GetAdminFeedbackParams {
  status?: FeedbackStatus;
  type?: FeedbackType;
}

/**
 * 운영자 처리
 * - reply를 새로 쓰거나 바꾸면 작성자에게 알림이 간다
 * - reply·adminNote에 빈 문자열을 보내면 지운다
 */
export interface UpdateFeedbackParams {
  status?: FeedbackStatus;
  reply?: string;
  adminNote?: string;
}
