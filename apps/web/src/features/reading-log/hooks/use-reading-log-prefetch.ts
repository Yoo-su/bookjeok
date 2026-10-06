import type { ReadingLog } from "@bookjeok/core";
import { readingLogsYearQueryOptions } from "@bookjeok/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { addMonths, isAfter, startOfMonth, subMonths } from "date-fns";
import { useEffect } from "react";

import { groupLogsByDate, logsInMonth } from "../utils/month-logs";

/** 이미 받기 시작한 표지 주소. 달을 오가도 다시 요청하지 않는다 */
const preloaded = new Set<string>();

/** 칸마다 맨 앞 표지를 브라우저 캐시에 받아 둠. 달력 칸이 같은 주소를 unoptimized로 그린다 */
const preloadCovers = (logs: ReadingLog[]) => {
  for (const dayLogs of groupLogsByDate(logs).values()) {
    const src = dayLogs[0].book.image;
    if (!src || preloaded.has(src)) continue;
    preloaded.add(src);
    new Image().src = src;
  }
};

/**
 * 앞뒤 달로 넘길 때 기다리지 않게 미리 받음
 * - 기록은 해 단위라 같은 해의 달은 이미 있다. 1·2월이면 지난해, 11·12월이면 다음 해를 받는다(미래는 빼고).
 *   경계 한 달 앞에서 받아 두어 하나씩 넘길 때 경계에서 기다리지 않는다
 * - 앞뒤 달 칸의 표지도 받아 넘긴 순간 표지가 늦게 뜨지 않게 한다
 */
export const useReadingLogPrefetch = (
  year: number,
  month: number,
  enabled = true,
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const current = new Date(year, month - 1);
    const thisMonth = startOfMonth(new Date());
    const targets = [subMonths(current, 1)];
    const next = addMonths(current, 1);
    // 미래 달로는 넘어가도 기록이 없다
    if (!isAfter(next, thisMonth)) targets.push(next);

    if (month <= 2) {
      void queryClient.prefetchQuery(readingLogsYearQueryOptions(year - 1));
    }
    if (month >= 11 && !isAfter(new Date(year + 1, 0), thisMonth)) {
      void queryClient.prefetchQuery(readingLogsYearQueryOptions(year + 1));
    }

    let cancelled = false;
    for (const target of targets) {
      const options = readingLogsYearQueryOptions(target.getFullYear());
      // 같은 해면 보고 있는 쿼리와 같은 키라 받는 중인 요청에 합류하고, 신선하면 요청하지 않는다
      void queryClient.prefetchQuery(options).then(() => {
        const logs = queryClient.getQueryData<ReadingLog[]>(options.queryKey);
        if (!cancelled && logs) preloadCovers(logsInMonth(logs, target));
      });
    }
    return () => {
      cancelled = true;
    };
    // enabled도 봐야 닫힌 채 그려졌다가 열린 패널에서 미리 받음
  }, [year, month, enabled, queryClient]);
};
