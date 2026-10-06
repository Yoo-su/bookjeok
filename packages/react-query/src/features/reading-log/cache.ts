import { ReadingLog, readingLogKeys } from "@bookjeok/core";

/** 기록 날짜(`YYYY-MM-DD`)가 속한 해의 목록 쿼리 키 */
export const yearListKey = (date: string) =>
  readingLogKeys.list({ year: Number(date.slice(0, 4)) }).queryKey;

/**
 * 날짜순 목록에 기록을 끼워 넣습니다. 같은 날 기록 뒤에 붙어 그날 맨 앞 표지는 그대로입니다.
 * 이미 있으면 그대로 돌려줍니다.
 */
export const insertLog = (logs: ReadingLog[], log: ReadingLog) => {
  if (logs.some((l) => l.id === log.id)) return logs;
  const at = logs.findIndex((l) => l.date > log.date);
  return at === -1
    ? [...logs, log]
    : [...logs.slice(0, at), log, ...logs.slice(at)];
};

/**
 * 수정된 기록을 한 해 목록에 반영합니다.
 * 날짜가 같으면 제자리에서 바꿔 같은 날 순서를 지키고, 날짜가 바뀌었으면 빼서 새 자리에 넣습니다.
 * 다른 해로 옮겨 간 기록은 빼기만 합니다(새 해 목록은 따로 넣음).
 */
export const applyUpdatedLog = (logs: ReadingLog[], log: ReadingLog) => {
  const at = logs.findIndex((l) => l.id === log.id);
  if (at !== -1 && logs[at].date === log.date) {
    return logs.map((l, i) => (i === at ? log : l));
  }
  return at === -1 ? logs : logs.filter((l) => l.id !== log.id);
};

/** 목록에서 기록을 뺍니다 */
export const removeLog = (logs: ReadingLog[], id: string) =>
  logs.some((l) => l.id === id) ? logs.filter((l) => l.id !== id) : logs;
