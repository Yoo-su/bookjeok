"use client";

import type { ReceivedKongLog } from "@bookjeok/core";
import { useReceivedKongsQuery } from "@bookjeok/react-query";
import { useMemo } from "react";

const EMPTY = new Map<string, ReceivedKongLog>();

/** 받은 콩을 기록 id로 찾는 표. 달력·목록·하루 상세가 같은 캐시를 쓴다 */
export function useReceivedKongMap(options?: { enabled?: boolean }) {
  const { data } = useReceivedKongsQuery(options);
  return useMemo(
    () => (data ? new Map(data.logs.map((log) => [log.logId, log])) : EMPTY),
    [data],
  );
}
