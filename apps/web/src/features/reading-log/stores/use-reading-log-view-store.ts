import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ReadingLogViewMode } from "../components/calendar-view/reading-log-controls";

interface ReadingLogViewState {
  /** 마지막으로 본 보기. 다음 방문 때 그대로 연다 */
  viewMode: ReadingLogViewMode;
  setViewMode: (viewMode: ReadingLogViewMode) => void;
}

/**
 * 내 독서기록 페이지의 보기 모드(달력·리스트·책탑). 기기에만 둔다.
 * 마이페이지는 로그인 가드가 서버에서 비워 두므로 저장값으로 첫 렌더를 해도 하이드레이션이 어긋나지 않는다.
 */
export const useReadingLogViewStore = create<ReadingLogViewState>()(
  persist(
    (set) => ({
      viewMode: "calendar",
      setViewMode: (viewMode) => set({ viewMode }),
    }),
    {
      name: "reading-log-view",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
