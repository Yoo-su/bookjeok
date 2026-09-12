import { BookSortParam } from "./types";

export const HOME_PUBLISHERS = [
  "민음사",
  "문학동네",
  "열린책들",
  "은행나무",
  "다산책방",
];

export const RECENT_BOOKS_KEY = "recent-books";

// 도서 목록 기본 설정
export const DEFAULT_DISPLAY = 20;
export const DEFAULT_START = 1;
export const DEFAULT_SORT: BookSortParam = "sim";

/**
 * 도서 상세 경로가 받는 ISBN 형식. ISBN-13(13자리) 또는 ISBN-10(9자리 + 0-9|X).
 *
 * 형식 검증 없이 통과시키면 임의 문자열이 전부 ISR 엔트리가 되어 경로 공간이 무한해진다.
 */
export const ISBN_PATTERN = /^(?:\d{13}|\d{9}[\dXx])$/;

/** 도서 상세 라우트로 보낼 수 있는 ISBN인지 확인한다. */
export const isValidIsbn = (isbn: string): boolean => ISBN_PATTERN.test(isbn);
