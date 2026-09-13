import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
} from "date-fns";
import { enUS, ko, Locale } from "date-fns/locale";

// 지원 로케일 → date-fns Locale 객체 매핑
const localeMap: Record<string, Locale> = {
  ko,
  en: enUS,
};

// 로케일별 사전 정의 포맷 패턴
const DATE_FORMATS = {
  ko: {
    date: "yyyy.MM.dd",
    dateTime: "yyyy.MM.dd HH:mm",
    full: "yyyy년 M월 d일",
    short: "yyyy.MM.dd",
    monthDay: "M월 d일",
    yearMonth: "yyyy년 M월",
    monthDayWeekday: "M월 d일 eeee",
    time: "HH:mm",
    monthDayShort: "M월 d일",
    day: "d",
  },
  en: {
    date: "yyyy-MM-dd",
    dateTime: "MMM d, yyyy HH:mm",
    full: "MMMM d, yyyy",
    short: "MM/dd/yyyy",
    monthDay: "MMM d",
    yearMonth: "MMM yyyy",
    monthDayWeekday: "eeee, MMM d",
    time: "HH:mm",
    monthDayShort: "MMM d",
    day: "d",
  },
} as const;

/** 사전 정의 포맷 키 타입 */
export type DateFormatKey = keyof (typeof DATE_FORMATS)["ko"];

/** 시각이 없는 순수 달력 날짜 (독서기록의 `date`, 라운지의 `latestDate`) */
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 날짜 문자열을 Date로 바꿉니다.
 *
 * `new Date("2026-09-13")`은 명세상 **UTC 자정**으로 파싱돼 KST에서는 그날
 * 오전 9시가 됩니다. 그래서 오늘 남긴 기록을 오전 9시 전에 보면 "약 9시간 후"
 * 처럼 미래로 표시됩니다. UTC보다 뒤진 타임존에서 보면 아예 하루 전 날짜로
 * 찍힙니다(이 사이트는 한/영 다국어라 실제로 발생).
 *
 * 달력 날짜는 시각이 없는 값이므로 로컬 자정으로 읽어 보는 사람의 타임존과
 * 무관하게 같은 날짜가 나오게 합니다. 오프셋이 붙은 ISO 타임스탬프
 * (`createdAt` 등)는 순간을 가리키는 값이므로 그대로 둡니다.
 */
function parseDateInput(date: Date | string): Date {
  if (typeof date !== "string") return date;

  const dateOnly = DATE_ONLY_PATTERN.exec(date);
  if (!dateOnly) return new Date(date);

  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** 로케일별 "오늘"·"어제". `chat-item`의 기존 방식을 따른다. */
const CALENDAR_DAY_TEXT: Record<string, { today: string; yesterday: string }> = {
  ko: { today: "오늘", yesterday: "어제" },
  en: { today: "Today", yesterday: "Yesterday" },
};

/** 로케일별 "N일 전". */
function daysAgoText(days: number, locale: string): string {
  return locale === "en" ? `${days} days ago` : `${days}일 전`;
}

/**
 * 달력 날짜를 며칠 전인지로 표시합니다.
 *
 * 경과 시간(`formatDistanceToNow`)으로 세면 안 됩니다. 날짜에는 시각이 없어
 * "어제"가 보는 시각에 따라 23~47시간이 되고, date-fns가 이를 반올림해
 * 어제를 "2일 전"으로 만듭니다. 달력 일수로 세야 하루 종일 같은 값이 나옵니다.
 */
function formatCalendarDay(date: Date, locale: string): string {
  const days = differenceInCalendarDays(new Date(), date);
  const text = CALENDAR_DAY_TEXT[locale] ?? CALENDAR_DAY_TEXT.en;

  if (days <= 0) return text.today;
  if (days === 1) return text.yesterday;

  return daysAgoText(days, locale);
}

/**
 * 로케일 문자열에 해당하는 date-fns Locale 객체를 반환합니다.
 * 매핑되지 않는 로케일이면 기본값(ko)을 반환합니다.
 */
export function getDateLocale(locale: string): Locale {
  return localeMap[locale] ?? ko;
}

/**
 * 로케일 기반 날짜 포맷 함수.
 * 사전 정의 키(full, short, date, dateTime 등)와 커스텀 포맷 문자열 모두 지원합니다.
 *
 * @param date - 날짜 객체 또는 ISO 문자열
 * @param locale - 로케일 문자열 ("ko" | "en")
 * @param formatKeyOrPattern - 사전 정의 포맷 키 또는 커스텀 포맷 문자열
 */
export function formatDate(
  date: Date | string,
  locale: string,
  formatKeyOrPattern: DateFormatKey | string,
): string {
  if (!date) return "";
  const dateObj = parseDateInput(date);
  if (isNaN(dateObj.getTime())) return "";

  const dateLocale = getDateLocale(locale);
  const localeKey = locale in DATE_FORMATS ? locale : "ko";
  const formats = DATE_FORMATS[localeKey as keyof typeof DATE_FORMATS];

  // 사전 정의 키에 해당하면 로케일별 패턴 사용, 아니면 입력값을 패턴으로 직접 사용
  const pattern =
    (formats[formatKeyOrPattern as DateFormatKey] as string | undefined) ??
    formatKeyOrPattern;

  return format(dateObj, pattern, { locale: dateLocale });
}

/**
 * 로케일 기반 상대 시간 포맷 함수. (예: "3분 전", "2 hours ago")
 *
 * @param date - 날짜 객체 또는 ISO 문자열
 * @param locale - 로케일 문자열 ("ko" | "en")
 */
export function formatRelativeTime(
  date: Date | string,
  locale: string,
): string {
  if (!date) return "";
  const dateObj = parseDateInput(date);
  if (isNaN(dateObj.getTime())) return "";

  // 시각이 없는 달력 날짜는 달력 일수로 센다.
  if (typeof date === "string" && DATE_ONLY_PATTERN.test(date)) {
    return formatCalendarDay(dateObj, locale);
  }

  const dateLocale = getDateLocale(locale);

  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: dateLocale,
  });
}
