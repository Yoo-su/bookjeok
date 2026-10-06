import type { ReadingLog } from "@bookjeok/core";
import { useState } from "react";

/**
 * 달력 칸의 맨 앞 표지가 새 기록으로 막 꽂혔는지.
 * 첫 렌더·불러오는 중·지워서 바뀐 경우는 false라 방금 기록한 칸만 움직인다
 */
export function useJustPlanted(logs: ReadingLog[], isLoading = false) {
  const firstId = logs[0]?.id;
  // 불러오는 중에 그려진 칸은 받은 뒤를 기준으로 삼는다(dock 패널은 빈 칸부터 그림)
  const [seen, setSeen] = useState<{ count: number; firstId?: string } | null>(
    isLoading ? null : { count: logs.length, firstId },
  );
  const [planted, setPlanted] = useState(false);

  if (!isLoading) {
    if (seen === null) {
      setSeen({ count: logs.length, firstId });
    } else if (seen.count !== logs.length || seen.firstId !== firstId) {
      setPlanted(logs.length > seen.count && firstId !== seen.firstId);
      setSeen({ count: logs.length, firstId });
    }
  }
  return planted;
}

/** 새 표지가 칸 위에서 내려와 꽂힘. 칸의 overflow-hidden이 잘라 틀 안으로 들어가 보인다 */
export const PLANT_COVER = {
  initial: { y: "-70%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: {
    y: { type: "spring", stiffness: 480, damping: 20 },
    opacity: { duration: 0.12 },
  },
} as const;
