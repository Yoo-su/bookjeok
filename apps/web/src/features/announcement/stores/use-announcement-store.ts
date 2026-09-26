import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AnnouncementState {
  /** 이미 본 공지 id. 기기에만 둔다 */
  seen: string[];
  markSeen: (id: string) => void;
}

export const useAnnouncementStore = create<AnnouncementState>()(
  persist(
    (set) => ({
      seen: [],
      markSeen: (id) =>
        set((s) => (s.seen.includes(id) ? s : { seen: [...s.seen, id] })),
    }),
    {
      name: "announcements-seen",
      storage: createJSONStorage(() => localStorage),
      // v0의 "reading-tower"는 이름을 바꾸기 전 독서 키재기 소개. 본 사람에게 다시 띄우지 않는다
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as { seen?: string[] };
        const seen = state.seen ?? [];
        return {
          ...state,
          seen:
            version < 1
              ? seen.map((id) =>
                  id === "reading-tower" ? "reading-stack" : id,
                )
              : seen,
        } as AnnouncementState;
      },
    },
  ),
);
