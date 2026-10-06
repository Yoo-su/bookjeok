"use client";

import { getReadingStack } from "@bookjeok/api-client";
import { readingLogKeys, type ReadingStackResponse } from "@bookjeok/core";
import { readingLogsYearQueryOptions } from "@bookjeok/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/** 키재기 패널이 한 줄로 보여 주는 최근 표지 수 */
export const STACK_PANEL_COVERS = 6;

/**
 * dock 달력·키재기 아이콘에 손이 닿을 때 패널 데이터를 미리 받음.
 * 열리는 도중 응답이 와 다시 그리면 열림 애니메이션이 끊김. 각 쿼리의 staleTime 안에는 다시 요청하지 않음
 */
export function useDockPeekPrefetch() {
  const queryClient = useQueryClient();

  const calendar = useCallback(() => {
    // 달력 패널과 독서기록 페이지가 같은 해 캐시를 쓴다
    void queryClient.prefetchQuery(
      readingLogsYearQueryOptions(new Date().getFullYear()),
    );
  }, [queryClient]);

  const stack = useCallback(() => {
    const year = new Date().getFullYear();
    const queryKey = readingLogKeys.stack(year).queryKey;
    void queryClient
      .prefetchQuery({ queryKey, queryFn: () => getReadingStack(year) })
      .then(() => {
        // 표지도 미리 받아 둠. 패널이 열린 뒤 하나씩 채워지지 않게
        const data = queryClient.getQueryData<ReadingStackResponse>(queryKey);
        data?.items.slice(-STACK_PANEL_COVERS).forEach(({ image }) => {
          new Image().src = image;
        });
      });
  }, [queryClient]);

  return { calendar, stack };
}
