export const DEFAULT_PAGE_SIZE = 10;

// 독서 기록 제한 사항
export const MAX_MEMO_LENGTH = 50;

// ✅ 라운지 관련 상수
export const LOUNGE_PAGE_SIZE = 20; // 라운지 피드 1페이지당 도서 수
export const LOUNGE_MAX_READERS_PER_CARD = 5; // 카드당 표시할 최대 독자 수
export const LOUNGE_POPULAR_COUNT = 10; // 인기 도서 최대 수
export const LOUNGE_POPULAR_DAYS = 30; // 인기 도서 집계 기간 (일)

/** 받은 콩에서 기록마다 내려주는 보낸 사람 수(최근 순). 수는 count가 전부 센다 */
export const KONG_SENDERS_PER_LOG = 10;
