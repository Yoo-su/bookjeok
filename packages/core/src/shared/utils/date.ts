import { format, formatDistanceToNow } from "date-fns";
import { enUS, ko, Locale } from "date-fns/locale";

/** 지원 로케일 → date-fns Locale. 매핑에 없으면 기본값 ko. */
const DATE_FNS_LOCALES: Record<string, Locale> = { ko, en: enUS };

export const getSimpleDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
};

/**
 * 타임존이 누락된 날짜 문자열도 항상 UTC로 정확히 해석할 수 있도록 안전하게 파싱합니다.
 *
 * **순간(instant) 전용입니다.** `createdAt`·`updatedAt`처럼 타임라인 위의 한 점을
 * 가리키는 값에만 쓰세요.
 *
 * 시각이 없는 달력 날짜(`YYYY-MM-DD`: 독서기록의 `date`, 도서의 `pubdate`)에는
 * 쓰면 안 됩니다. UTC 자정으로 해석되어 UTC보다 뒤진 타임존에서는 전날로,
 * 앞선 타임존에서는 그날 오전으로 밀립니다. 달력 날짜는 웹의
 * `parseCalendarDate`로 로컬 자정으로 읽으세요.
 */
export const parseSafeISO = (dateString: string): Date => {
  if (!dateString) return new Date();

  // 이미 타임존 오프셋(Z, +, -)이 포함되어 있다면 표준 Date 생성자 사용
  if (
    dateString.endsWith("Z") ||
    dateString.includes("+") ||
    /-\d{2}:\d{2}$/.test(dateString)
  ) {
    return new Date(dateString);
  }

  // 공백을 'T'로 규격화하고 끝에 'Z'(UTC)를 덧붙여서 강제로 UTC 해석 유도
  const formatted = dateString.replace(" ", "T");
  return new Date(`${formatted}Z`);
};

/**
 * 게시글 시간을 상대 시간 또는 날짜로 포맷하는 함수
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @param locale - 상대 시간 표기에 쓸 로케일 ("ko" | "en"). 생략하면 ko
 */
export const formatPostDate = (
  dateString: string,
  locale: string = "ko",
): string => {
  const date = parseSafeISO(dateString);
  const now = new Date();

  // 에포크 밀리초 차이 계산
  const diffInMs = now.getTime() - date.getTime();

  // 서버-클라이언트 오차 등으로 인해 미래 시간으로 잡히는 경우 방어 (최소 0)
  const safeDiffInMs = Math.max(0, diffInMs);
  const diffInDays = safeDiffInMs / (1000 * 60 * 60 * 24);

  // 7일 이내의 글은 상대 시간으로 표시 (예: "3일 전")
  if (diffInDays < 7) {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: DATE_FNS_LOCALES[locale] ?? ko,
    });
  }

  // 7일이 지난 글은 'YYYY.MM.DD' 형식으로 표시
  return format(date, "yyyy.MM.dd");
};
