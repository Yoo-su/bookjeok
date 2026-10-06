import type { ReadingLog } from "@bookjeok/core";
import { format } from "date-fns";

const monthPrefix = (month: Date) => format(month, "yyyy-MM");

/** 한 해 기록에서 그 달 기록만 */
export const logsInMonth = (logs: ReadingLog[], month: Date) => {
  const prefix = monthPrefix(month);
  return logs.filter((log) => log.date.startsWith(prefix));
};

/** 기록을 날짜(`YYYY-MM-DD`)별로 묶음. 들어온 순서(같은 날은 기록한 순서)를 지킨다 */
export const groupLogsByDate = (logs: ReadingLog[]) => {
  const map = new Map<string, ReadingLog[]>();
  for (const log of logs) {
    const list = map.get(log.date);
    if (list) list.push(log);
    else map.set(log.date, [log]);
  }
  return map;
};
