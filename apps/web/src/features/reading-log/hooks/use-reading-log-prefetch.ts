import { getReadingLogs, getReadingLogStats } from "@bookjeok/api-client";
import { readingLogKeys } from "@bookjeok/core";
import { useQueryClient } from "@tanstack/react-query";
import { addMonths, isAfter, startOfMonth, subMonths } from "date-fns";
import { useEffect } from "react";

import { CACHE_TIME } from "@/shared/constants/cache";

/**
 * 앞뒤 달 기록을 미리 받음
 * @param withStats 월 통계도 받을지. 통계를 안 그리는 dock 달력 패널은 false
 */
export const useReadingLogPrefetch = (
  year: number,
  month: number,
  enabled = true,
  withStats = true,
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const currentDate = new Date(year, month - 1);
    const prevDate = subMonths(currentDate, 1);
    const nextDate = addMonths(currentDate, 1);

    const targetDates = [prevDate];

    // nextDate가 현재 달(오늘)을 초과하는 '미래 달'이 아닐 경우에만 prefetch에 포함
    if (!isAfter(startOfMonth(nextDate), startOfMonth(new Date()))) {
      targetDates.push(nextDate);
    }

    targetDates.forEach((date) => {
      const targetYear = date.getFullYear();
      const targetMonth = date.getMonth() + 1;

      queryClient.prefetchQuery({
        queryKey: readingLogKeys.list({ year: targetYear, month: targetMonth })
          .queryKey,
        queryFn: () => getReadingLogs({ year: targetYear, month: targetMonth }),
        staleTime: CACHE_TIME.FIVE_MINUTES,
      });

      if (!withStats) return;
      queryClient.prefetchQuery({
        queryKey: readingLogKeys.stats(targetYear, targetMonth).queryKey,
        queryFn: () =>
          getReadingLogStats({ year: targetYear, month: targetMonth }),
        staleTime: CACHE_TIME.FIVE_MINUTES,
      });
    });
    // enabled도 봐야 닫힌 채 그려졌다가 열린 패널에서 미리 받음
  }, [year, month, enabled, withStats, queryClient]);
};
