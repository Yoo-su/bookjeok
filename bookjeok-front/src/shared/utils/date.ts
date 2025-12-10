import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

/**
 * yyyymmdd 형태의 date 문자열을 반환합니다.
 * @param date
 * @returns
 */
export const getSimpleDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
};

/**
 * 게시글 시간을 상대 시간 또는 날짜로 포맷하는 함수
 * @param dateString - ISO 8601 형식의 날짜 문자열
 */
export const formatPostDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

  // 7일 이내의 글은 상대 시간으로 표시 (예: "3일 전")
  if (diffInDays < 7) {
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  }

  // 7일이 지난 글은 'YYYY.MM.DD' 형식으로 표시
  return format(date, "yyyy.MM.dd");
};
