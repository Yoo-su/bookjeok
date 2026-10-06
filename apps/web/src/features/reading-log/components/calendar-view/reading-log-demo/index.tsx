"use client";

import type { ReadingLog } from "@bookjeok/core";
import { useState } from "react";

import { SAMPLE_BOOKS } from "../../stack-view/lib/sample-books";
import { ReadingLogCalendar } from "../reading-log-calendar";

/** 예시 46권을 독서 기록 모양으로. 스토리도 같은 데이터를 씀 */
export const SAMPLE_LOGS: ReadingLog[] = SAMPLE_BOOKS.map((b) => ({
  id: b.logId,
  userId: 0,
  isbn: b.isbn,
  book: {
    isbn: b.isbn,
    title: b.title,
    author: b.author,
    publisher: b.publisher,
    image: b.image,
  },
  date: b.date,
  memo: b.memo,
  createdAt: b.date,
  updatedAt: b.date,
}));

const toMonth = (date: string) => new Date(`${date.slice(0, 7)}-01T00:00:00`);
const FIRST = toMonth(SAMPLE_LOGS[0].date);
const LAST = toMonth(SAMPLE_LOGS[SAMPLE_LOGS.length - 1].date);
// 예시가 가장 고르게 찬 달(6권)
const START = new Date(2026, 6, 1);

/** 소개 페이지의 체험 달력. 예시 46권을 읽기 전용으로 넘겨 보며, 예시가 없는 달로는 가지 않는다 */
export function ReadingLogDemo() {
  const [current, setCurrent] = useState(START);
  const move = (next: Date) =>
    setCurrent(next < FIRST ? FIRST : next > LAST ? LAST : next);

  return (
    <ReadingLogCalendar
      readOnly
      initialLogs={SAMPLE_LOGS}
      currentDate={current}
      onDateChange={move}
    />
  );
}
