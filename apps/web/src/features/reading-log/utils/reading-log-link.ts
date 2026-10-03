import { isValid, parse } from "date-fns";

import { PATHS } from "@/shared/constants/paths";

import type { ReadingLogViewMode } from "../components/calendar-view/reading-log-controls";

/**
 * 내 독서기록 페이지 딥링크. dock 패널에서 넘어갈 때 보던 맥락을 잇는다
 * - date: 그 달을 열고 그날 상세를 띄움
 * - month: 그 달을 엶
 * - view: 달력·리스트·독서 키재기 중 하나로 엶
 */
export interface ReadingLogLink {
  date?: Date;
  month?: Date;
  view?: ReadingLogViewMode;
}

const VIEWS: readonly ReadingLogViewMode[] = ["calendar", "list", "stack"];

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ym = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function readingLogHref({ date, month, view }: ReadingLogLink) {
  const params = new URLSearchParams();
  if (view) params.set("view", view);
  if (date) params.set("date", ymd(date));
  else if (month) params.set("month", ym(month));
  const query = params.toString();
  return query ? `${PATHS.READING_LOG}?${query}` : PATHS.READING_LOG;
}

/** 달력 날짜는 로컬 자정으로 읽음(UTC로 읽으면 하루 밀림) */
export function parseReadingLogLink(
  params: URLSearchParams,
): ReadingLogLink | null {
  const view = params.get("view") as ReadingLogViewMode | null;
  const rawDate = params.get("date");
  const rawMonth = params.get("month");

  const date = rawDate ? parse(rawDate, "yyyy-MM-dd", new Date()) : null;
  const month = rawMonth ? parse(rawMonth, "yyyy-MM", new Date()) : null;

  const link: ReadingLogLink = {};
  if (view && VIEWS.includes(view)) link.view = view;
  if (date && isValid(date)) link.date = date;
  else if (month && isValid(month)) link.month = month;

  return Object.keys(link).length ? link : null;
}
